import { EventEmitter } from "events";
import { existsSync } from "fs";
import { QRCodeViewer } from "./QRViewer/qrcodeViewer";

const child_process = require("child_process")

export class DebugRuntime extends EventEmitter {

    cwd: string = ""
    exec: any = undefined
    platform: string = "ios"
    device: string | undefined = undefined
    os: string | undefined = undefined
    private writeBuffer: string = ""

    start() {
        this.buildAndRun()
    }

    stop() {
        if (this.exec) {
            try {
                require('child_process').execSync(`kill $(lsof -t -i:8090)`)
            } catch (error) { }
        }
    }

    buildAndRun() {
        if (this.platform === "ios") {
            this.exec = child_process.exec(`node ./node_modules/.bin/xt debug run ios${this.device ? ` --device "${this.device}"` : ""}${this.os ? " --os " + this.os : ""}`, { cwd: this.cwd })
        }
        else if (this.platform === "android") {
            this.exec = child_process.exec(`node ./node_modules/.bin/xt debug run android`, { cwd: this.cwd })
        }
        else if (this.platform === "chrome") {
            this.exec = child_process.exec(`node ./node_modules/.bin/xt debug run chrome`, { cwd: this.cwd })
        }
        else if (this.platform === "qrcode") {
            this.exec = child_process.exec(`node ./node_modules/.bin/xt debug run qrcode`, { cwd: this.cwd })
        }
        else {
            throw Error("platform should be 'ios', 'android', 'chrome'.")
        }
        if (this.exec) {
            this.exec.stdout.on("data", (data: any) => {
                const values: string = data.toString()
                values.split("\n").forEach(it => {
                    if (this.handleQRCode(it)) { return }
                    if (this.handleBreak(it)) { return }
                    if (this.handleLog(it)) { return }
                    this.emit("output", it)
                })
            })
            this.exec.stderr.on("data", (data: any) => {
                this.emit("output", data)
            })
            this.exec.on("close", () => {
                this.emit("end")
            })
            this.exec.write(this.writeBuffer)
            this.writeBuffer = ""
        }
    }

    setBreakpoints(uris: string[]) {
        if (this.exec) {
            this.exec.stdin.write(`[Tiny-Debugger] setBreakpoints on ${JSON.stringify(uris)}\n`)
        }
        else {
            this.writeBuffer += `[Tiny-Debugger] setBreakpoints on ${JSON.stringify(uris)}\n`
        }
    }

    setBreakpoint(uri: string) {
        if (this.exec) {
            this.exec.stdin.write(`[Tiny-Debugger] setBreakpoint on ${uri}\n`)
        }
        else {
            this.writeBuffer += `[Tiny-Debugger] setBreakpoint on ${uri}\n`
        }
    }

    removeBreakpoint(uri: string) {
        if (this.exec) {
            this.exec.stdin.write(`[Tiny-Debugger] removeBreakpoint on ${uri}\n`)
        }
        else {
            this.writeBuffer += `[Tiny-Debugger] removeBreakpoint on ${uri}\n`
        }
    }

    removeBreakpointsWithPrefix(prefix: string) {
        if (this.exec) {
            this.exec.stdin.write(`[Tiny-Debugger] removeBreakpointsWithPrefix ${prefix}\n`)
        }
        else {
            this.writeBuffer += `[Tiny-Debugger] removeBreakpointsWithPrefix ${prefix}\n`
        }
    }

    handleBreak(data: any): boolean {
        if (typeof data === "string" && data.indexOf("[Tiny-Debugger] Enter 'c' to continue.") >= 0) {
            return true
        }
        if (typeof data === "string" && data.indexOf("[Tiny-Debugger] Break variables ") >= 0) {
            const encodedData = data.replace("[Tiny-Debugger] Break variables ", "").trim()
            try {
                this.emit("variables", JSON.parse(new Buffer(encodedData, "base64").toString()))
            } catch (error) { }
            return true
        }
        if (typeof data === "string" && data.indexOf("[Tiny-Debugger] Break on ") >= 0) {
            const bpFile = data.replace("[Tiny-Debugger] Break on ", "").trim()
            const fileName = bpFile.split(":")[0]
            const lineNum = bpFile.split(":")[1]
            this.emit("break", fileName ? fileName.trim() : undefined, lineNum ? lineNum.trim() : undefined)
            return true
        }
        return false
    }

    handleLog(data: any): boolean {
        if (typeof data === "string" && data.indexOf("<<<") >= 0) {
            const components = data.split("<<<")
            if (components[0].trim().length === 0) { return true }
            const fileName = components[1].split(":")[0]
            const lineNum = components[1].split(":")[1]
            if (fileName && fileName.trim() === "REPL") {
                this.emit("output", components[0], "REPL", "0")
                return true
            }
            else {
                this.emit("output", components[0], fileName ? fileName.trim() : undefined, lineNum ? lineNum.trim() : undefined)
                return true
            }
        }
        return false
    }

    handleQRCode(data: any): boolean {
        if (typeof data === "string" && data.indexOf("====== QRCode Content >>>") >= 0) {
            this.emit("qrcode", data.replace("====== QRCode Content >>>", "").trim())
            return true
        }
        return false
    }

    handleContinue() {
        this.exec.stdin.write('c\n')
    }

    handleNext() {
        this.exec.stdin.write('n\n')
    }

    handleRepl(script: string) {
        this.exec.stdin.write(script + "\n")
    }

}