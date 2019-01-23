import { EventEmitter } from "events";

const child_process = require("child_process")

export class DebugRuntime extends EventEmitter {

    cwd: string = ""
    exec: any = undefined
    platform: string = "ios"
    device: string | undefined = undefined
    os: string | undefined = undefined

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
        else if (this.platform === "web") {
            this.exec = child_process.exec(`node ./node_modules/.bin/xt debug run chrome`, { cwd: this.cwd })
        }
        else {
            throw Error("platform should be 'ios', 'android', 'web'.")
        }
        if (this.exec) {
            this.exec.stdout.on("data", (data: any) => {
                if (this.handleLog(data)) { return }
                this.emit("output", data)
            })
            this.exec.stderr.on("data", (data: any) => {
                this.emit("output", data)
            })
            this.exec.on("close", () => {
                this.emit("end")
            })
        }
    }

    handleLog(data: any): boolean {
        if (typeof data === "string" && data.indexOf("<<<") >= 0) {
            const components = data.split("<<<")
            this.emit("output", components[0], components[1].split(":")[0], components[1].split(":")[1])
            return true
        }
        return false
    }

}