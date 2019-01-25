import {
    LoggingDebugSession,
    InitializedEvent, OutputEvent, StoppedEvent, BreakpointEvent,
    Thread, Source, TerminatedEvent, Breakpoint,
    StackFrame, Scope, Handles, ContinuedEvent,
} from 'vscode-debugadapter';
import { DebugRuntime } from './debugRuntime';
import { DebugProtocol } from 'vscode-debugprotocol';
import { basename } from 'path';

export class DebugSession extends LoggingDebugSession {

    private runtime = new DebugRuntime
    private breakingParams: { filePath?: string, line?: number, column?: number } = {}
    private breakingVariables: any = {}
    private variableHandles = new Handles<string>();

    private static THREAD_ID = 1;

    public constructor() {
        super()
        this.setDebuggerLinesStartAt1(true)
        this.setDebuggerColumnsStartAt1(true)
        this.runtime.on('break', (filePath, line, column) => {
            this.sendEvent(new StoppedEvent('breakpoint', DebugSession.THREAD_ID));
            this.breakingParams.filePath = filePath
            this.breakingParams.line = parseInt(line)
            this.breakingParams.column = parseInt(column)
            this.breakingVariables = {}
            this.variableHandles = new Handles<string>();
            this.sendEvent(new BreakpointEvent('changed', new Breakpoint(true, line, undefined, this.createSource(filePath))));
        });
        this.runtime.on('variables', (variables) => {
            this.breakingVariables = variables || {}
            this.variableHandles = new Handles<string>();
        });
        this.runtime.on('output', (text, filePath, line, column) => {
            const e: DebugProtocol.OutputEvent = new OutputEvent(`${text}\n`);
            if (filePath !== undefined) {
                e.body.source = this.createSource(filePath);
            }
            if (line !== undefined) {
                e.body.line = parseInt(line.trim());
            }
            if (column !== undefined) {
                e.body.column = parseInt(column.trim());
            }
            this.sendEvent(e);
        });
        this.runtime.on('qrcode', (url) => {
            this.sendEvent({ event: "xt.activeQRCode", body: { url }, seq: 0, type: "message" })
        })
        this.runtime.on('end', () => {
            this.sendEvent(new TerminatedEvent());
        })
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
        response.body = response.body || {};
        response.body.supportsEvaluateForHovers = false;
        response.body.supportsStepBack = false;
        this.sendResponse(response);
        this.sendEvent(new InitializedEvent());
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: any) {
        this.runtime.cwd = args.workspace
        this.runtime.platform = args.platform
        this.runtime.device = args.device
        this.runtime.os = args.os
        this.sendResponse(response);
        this.runtime.start()
    }

    protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void {
        const path = (<string>args.source.path).replace(this.runtime.cwd + "/", "");
        const clientLines = args.lines || [];
        this.runtime.removeBreakpointsWithPrefix(path.trim())
        this.runtime.setBreakpoints(clientLines.map(line => {
            return path + ":" + this.convertClientLineToDebugger(line)
        }))
        this.sendResponse(response);
    }

    protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        response.body = {
            threads: [
                new Thread(DebugSession.THREAD_ID, "thread 1")
            ]
        };
        this.sendResponse(response);
    }

    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
        if (this.breakingParams.filePath !== undefined && this.breakingParams.line !== undefined) {
            response.body = {
                stackFrames: [new StackFrame(0, "breakpoint", this.createSource(this.breakingParams.filePath), this.breakingParams.line)],
                totalFrames: 1
            };
        }
        this.sendResponse(response);
    }

    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
        const scopes = new Array<Scope>();
        scopes.push(new Scope("Local", this.variableHandles.create("$$local"), false));
        response.body = {
            scopes: scopes
        };
        this.sendResponse(response);
    }

    protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void {
        const variables = new Array<DebugProtocol.Variable>();
        const id = this.variableHandles.get(args.variablesReference);
        if (id !== null) {
            const targetData = eval("this.breakingVariables" + id.replace("$$local", ""))
            for (const vKey in targetData) {
                if (targetData.hasOwnProperty(vKey)) {
                    const value = targetData[vKey];
                    if (typeof value === "string") {
                        variables.push({
                            name: vKey,
                            type: "string",
                            value: value,
                            variablesReference: 0
                        })
                    }
                    else if (typeof value === "number") {
                        variables.push({
                            name: vKey,
                            type: Number.isInteger(value) ? "integer" : "float",
                            value: value.toString(),
                            variablesReference: 0
                        })
                    }
                    else if (typeof value === "boolean") {
                        variables.push({
                            name: vKey,
                            type: "boolean",
                            value: value ? "true" : "false",
                            variablesReference: 0
                        })
                    }
                    else if (typeof value === "object") {
                        variables.push({
                            name: vKey,
                            type: "object",
                            value: "Object",
                            variablesReference: this.variableHandles.create(`${id}.${vKey}`)
                        })
                    }
                }
            }
        }
        response.body = {
            variables: variables
        };
        this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        this.runtime.handleContinue()
        this.sendResponse(response);
    }

    protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
        this.runtime.handleNext()
        this.sendResponse(response);
    }

    protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {
        this.runtime.handleRepl(args.expression)
        this.sendResponse(response)
        if (args.expression === "c") {
            this.sendEvent(new ContinuedEvent(DebugSession.THREAD_ID))
        }
    }

    protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): void {
        this.runtime.stop()
        this.sendResponse(response)
    }

    //---- helpers

    private createSource(filePath: string): Source {
        return new Source(basename(filePath), `${this.runtime.cwd}/${filePath.trim()}`, undefined, undefined, 'xt-adapter-data');
    }

}