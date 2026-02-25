export interface commandResult {
    matched: boolean,
    args?: Record<string, string>
}

export interface commandShape {
    prefix: string,
    args: string[]
}

export function parseCommand(shape: commandShape, query: string, wordBlacklist?: string[]): commandResult {
    let result = { matched: false, arguments: {} } as commandResult;
    
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
            let currentString = "";
            while ( tokenized[tokenIndex] != nextExpectedToken ) {
                currentString += ((currentString.length > 0) ? " " : "") + tokenized[tokenIndex];
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
console.log(parseCommand({prefix:"set", args:["color"]} as CommandShape, "set example lamp color to blue please", ["to", "please"]));
