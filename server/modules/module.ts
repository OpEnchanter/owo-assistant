interface moduleResult {
    endRequest: boolean,
    response: String,
}

class module {
    constructor () {}
    public onQuery(): moduleResult {
        return {endRequest: false, response: ""} as moduleResult;
    }
}