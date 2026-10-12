/**
 * Host-private nested-handle composition only; not a broker, RPC or production caller.
 * The reader still independently enforces exact-account/revision/sealed agent rights.
 */
import { PLUGIN_ID_PATTERN } from '../../shared/plugins/plugin-manifest';
import type { AuthIdentity } from './authorization-ledger';
import { assertMailActivityAuthority } from './mail-account-activity';
import {
	MAIL_AGENT_RIGHTS,
	parseMailAuthIdentity,
	type MailAgentRight,
} from './mail-account-ledger';
import type { MailHeaderReadAuthority } from './mail-account-read';
import { ImapConnectionError } from './mail-imap-connection';
import { PluginToolRunIdentity } from './plugin-tool-run-identity';

/** All dependencies come from main's current child provenance, never request fields. */
export interface MailInvocationReadAuthorityDeps {
	readonly toolIdentity: PluginToolRunIdentity;
	readonly pluginId: string;
	readonly identity: AuthIdentity;
	/**
	 * Synchronously recheck feature, manifest, broker, sealed consent, exact dual identity
	 * and plugin generation for this fixed right and verified agent. Must throw on denial.
	 * Success must return exactly undefined synchronously; async assertions are denied.
	 * Host lifecycle changes must also abort the registry's captured run/plugin signal.
	 */
	assertPolicyActive(
		pluginId: string,
		identity: AuthIdentity,
		agentId: string,
		right: MailAgentRight
	): void;
}

/** No default registry, identity, policy, ambient caller or account authority. */
export class MailInvocationReadAuthority {
	private readonly toolIdentity: PluginToolRunIdentity;
	private readonly pluginId: string;
	private readonly identity: AuthIdentity;
	private readonly checkPolicy: MailInvocationReadAuthorityDeps['assertPolicyActive'];

	constructor(deps: MailInvocationReadAuthorityDeps) {
		try {
			// Snapshot host-owned dependencies once, including their bound receiver.
			const toolIdentity = deps?.toolIdentity;
			const pluginId = deps?.pluginId;
			const checkPolicy = deps?.assertPolicyActive;
			if (
				!(toolIdentity instanceof PluginToolRunIdentity) ||
				typeof pluginId !== 'string' ||
				pluginId.length < 3 ||
				pluginId.length > 100 ||
				!PLUGIN_ID_PATTERN.test(pluginId) ||
				typeof checkPolicy !== 'function'
			)
				throw new ImapConnectionError('MAIL_DENIED');
			this.toolIdentity = toolIdentity;
			this.pluginId = pluginId;
			this.identity = parseMailAuthIdentity(deps.identity);
			this.checkPolicy = checkPolicy.bind(deps);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
			);
		}
	}

	/**
	 * Resolve only a nested handle from this exact registry/plugin. A context object,
	 * run proof or caller ID is never accepted. Does not mint, release or extend a handle.
	 * Return only to trusted host code; no callbacks/signals may cross into the child.
	 */
	resolve(invocationId: unknown): MailHeaderReadAuthority {
		try {
			const context = this.toolIdentity.resolveInvocation(this.pluginId, invocationId);
			context.assertActive();
			let checking = false;
			let failed = false;
			return Object.freeze({
				agentId: context.callerAgentId,
				signal: context.signal,
				assertActive: (
					right: MailAgentRight,
					pluginId: string,
					identity: AuthIdentity,
					agentId: string
				) => {
					if (checking || failed) {
						// The owner must stay denied even if a policy callback catches recursion.
						failed = true;
						throw new ImapConnectionError('MAIL_DENIED');
					}
					checking = true;
					try {
						assertMailActivityAuthority(() => {
							context.assertActive();
							if (failed) throw new ImapConnectionError('MAIL_DENIED');
							if (!MAIL_AGENT_RIGHTS.includes(right)) throw new ImapConnectionError('MAIL_DENIED');
							const readerIdentity = parseMailAuthIdentity(identity);
							if (
								pluginId !== this.pluginId ||
								agentId !== context.callerAgentId ||
								readerIdentity.contentHash !== this.identity.contentHash ||
								readerIdentity.signatureStatus !== this.identity.signatureStatus ||
								readerIdentity.signerKey !== this.identity.signerKey
							)
								throw new ImapConnectionError('MAIL_DENIED');
							if (failed) throw new ImapConnectionError('MAIL_DENIED');
							assertMailActivityAuthority(() =>
								this.checkPolicy(this.pluginId, this.identity, context.callerAgentId, right)
							);
							if (failed) throw new ImapConnectionError('MAIL_DENIED');
							// Policy checks may synchronously stop/revoke the run or replace the child.
							context.assertActive();
							if (failed) throw new ImapConnectionError('MAIL_DENIED');
						});
					} catch (error) {
						failed = true;
						throw new ImapConnectionError(
							error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
						);
					} finally {
						checking = false;
					}
				},
			});
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
			);
		}
	}
}
