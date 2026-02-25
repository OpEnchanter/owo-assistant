export interface CommandResult {
    matched: boolean,
    args?: Record<string, string>
}

export interface CommandShape {
    prefix: string,
    args: string[]
}

export function parseCommand(shape: CommandShape, query: string, wordBlacklist?: string[]): CommandResult {
    let result = { matched: false, arguments: {} } as CommandResult;
    
    let queryLowerCase = query.replaceAll(/\p{P}/gu, '').toLowerCase();
    if ( wordBlacklist ) { queryLowerCase = queryLowerCase.replaceAll(new RegExp(wordBlacklist.join('|'), 'gi'), ''); }
    const tokenized = queryLowerCase.split(" ");
    
    if ( tokenized.includes(shape.prefix) ) { result.matched = true; }
    
    if ( result.matched ) {
        const commandStartIndex = tokenized.indexOf(shape.prefix);
        let argumentIndex = -1;
        let nextExpectedToken = shape.args[argumentIndex+1];
        let currentArgument = shape.prefix;
        let latestSearchindex = commandStartIndex;
        let tokenIndex = latestSearchindex + 1;

        while ( argumentIndex < shape.args.length ) {
            if ( !tokenized.includes(nextExpectedToken) && nextExpectedToken != undefined ) {
                result.matched = false;
                return result;
            }

            let currentString = "";
            while ( tokenized[tokenIndex] != nextExpectedToken ) {
                currentString += ((currentString.length > 0 && nextExpectedToken != undefined) ? " " : "") + tokenized[tokenIndex];
                tokenIndex++;
            }
            tokenIndex++;

            result.arguments[currentArgument] = currentString;

            argumentIndex++;
            nextExpectedToken = shape.args[argumentIndex+1];
            currentArgument = shape.args[argumentIndex];
        }
    }

    return result;
}

// Example proof of functionality
const query = "set example lamp temperature blue"
console.log(`col. ${parseCommand({prefix:"set", args:["color"]} as CommandShape, query, ["to", "please"]).matched}`);
console.log(`temp. ${parseCommand({prefix:"set", args:["temperature"]} as CommandShape, query, ["to", "please"]).matched}`);
console.log(`bright. ${parseCommand({prefix:"set", args:["brightness"]} as CommandShape, query, ["to", "please"]).matched}`);
