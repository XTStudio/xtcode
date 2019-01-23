import {
    // Logger, logger,
    LoggingDebugSession,
    InitializedEvent, OutputEvent,
    // , StoppedEvent, BreakpointEvent, 
    Thread, Source, TerminatedEvent,
    // StackFrame, Scope,  Handles, Breakpoint
} from 'vscode-debugadapter';
import { DebugRuntime } from './debugRuntime';
import { DebugProtocol } from 'vscode-debugprotocol';
import { basename } from 'path';

export class DebugSession extends LoggingDebugSession {

    private runtime = new DebugRuntime

    private static THREAD_ID = 1;

    public constructor() {
        super()
        this.setDebuggerLinesStartAt1(true)
        this.setDebuggerColumnsStartAt1(true)
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
        // const path = <string>args.source.path;
        // const clientLines = args.lines || [];

        // clear all breakpoints for this file
        // this._runtime.clearBreakpoints(path);

        // set and verify breakpoint locations
        // const actualBreakpoints = clientLines.map(l => {
        //     let { verified, line, id } = this._runtime.setBreakPoint(path, this.convertClientLineToDebugger(l));
        //     const bp = <DebugProtocol.Breakpoint>new Breakpoint(verified, this.convertDebuggerLineToClient(line));
        //     bp.id = id;
        //     return bp;
        // });

        // // send back the actual breakpoint positions
        // response.body = {
        //     breakpoints: actualBreakpoints
        // };
        // this.sendResponse(response);
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

        // const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
        // const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
        // const endFrame = startFrame + maxLevels;

        // const stk = this._runtime.stack(startFrame, endFrame);

        // response.body = {
        //     stackFrames: stk.frames.map(f => new StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line))),
        //     totalFrames: stk.count
        // };
        // this.sendResponse(response);
    }

    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {

        // const frameReference = args.frameId;
        // const scopes = new Array<Scope>();
        // scopes.push(new Scope("Local", this._variableHandles.create("local_" + frameReference), false));
        // scopes.push(new Scope("Global", this._variableHandles.create("global_" + frameReference), true));

        // response.body = {
        //     scopes: scopes
        // };
        // this.sendResponse(response);
    }

    protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void {

        // const variables = new Array<DebugProtocol.Variable>();
        // const id = this._variableHandles.get(args.variablesReference);
        // if (id !== null) {
        //     variables.push({
        //         name: id + "_i",
        //         type: "integer",
        //         value: "123",
        //         variablesReference: 0
        //     });
        //     variables.push({
        //         name: id + "_f",
        //         type: "float",
        //         value: "3.14",
        //         variablesReference: 0
        //     });
        //     variables.push({
        //         name: id + "_s",
        //         type: "string",
        //         value: "hello world",
        //         variablesReference: 0
        //     });
        //     variables.push({
        //         name: id + "_o",
        //         type: "object",
        //         value: "Object",
        //         variablesReference: this._variableHandles.create("object_")
        //     });
        // }

        // response.body = {
        //     variables: variables
        // };
        // this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        // this._runtime.continue();
        this.sendResponse(response);
    }

    protected reverseContinueRequest(response: DebugProtocol.ReverseContinueResponse, args: DebugProtocol.ReverseContinueArguments): void {
        // this._runtime.continue(true);
        this.sendResponse(response);
    }

    protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
        // this._runtime.step();
        this.sendResponse(response);
    }

    protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void {
        // this._runtime.step(true);
        this.sendResponse(response);
    }

    protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {


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