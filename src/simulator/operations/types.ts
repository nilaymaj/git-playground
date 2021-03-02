import { SandboxState } from '../types';

export type Operation<A, R> = (system: SandboxState, args: A) => R;
