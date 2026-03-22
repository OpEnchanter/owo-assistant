export interface CommandResult {
    matched: boolean,
    args: Record<string, string>
}

export interface CommandShape {
    prefix: string,
    args: string[]
}

export function parseCommand(shape: CommandShape, query: string, wordBlacklist?: string[]): CommandResult {
    let result = { matched: false, args: {} } as CommandResult;
    
    let queryLowerCase = query.replaceAll(/\p{P}/gu, '').toLowerCase();
    if ( wordBlacklist ) {
        const escaped = wordBlacklist.map(w => w.trim()).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        queryLowerCase = queryLowerCase.replace(new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'gi'), ''); 
    }
    const tokenized = queryLowerCase.split(" ");

    const tokenizedPrefix = shape.prefix.split(" ");
    let commandStartIndex = tokenized.indexOf(tokenizedPrefix[0])
    let matchedKeys = 1;
    for (let i = 1; i < tokenizedPrefix.length; i++) {
        if (tokenized[commandStartIndex+1] == tokenizedPrefix[i]) { 
            commandStartIndex++;
            matchedKeys++;
        } else {
            result.matched = false;
        }
    }
    
    if ( matchedKeys == tokenizedPrefix.length ) { result.matched = true; }
    
    if ( result.matched ) {
        let argumentIndex = -1;
        let nextExpectedToken = shape.args[argumentIndex+1];
        let currentArgument: string = shape.prefix;
        let latestSearchindex = commandStartIndex;
        let tokenIndex = latestSearchindex + 1;

        while ( argumentIndex < shape.args.length ) {
            if ( !tokenized.includes(nextExpectedToken) && nextExpectedToken != undefined ) {
                result.matched = false;
                return result;
            }

            let currentString = "";
            while ( tokenized[tokenIndex] != nextExpectedToken ) {
                currentString += ((currentString.length > 0 && tokenIndex < tokenized.length) ? " " : "") + tokenized[tokenIndex];
                tokenIndex++;
            }
            tokenIndex++;

            result.args[currentArgument] = currentString;

            argumentIndex++;
            nextExpectedToken = shape.args[argumentIndex+1];
            currentArgument = shape.args[argumentIndex];
        }
    }

    return result;
}
