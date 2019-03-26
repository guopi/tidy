namespace myna {
    interface Rule {
        type: string;
        name: string;
        rules: Rule[];
    }

    export interface AstNode {
        rule: Rule;
        input: string;
        start: number;
        end: number;
        children: AstNode[];
    }
}
export type PathAstNode = myna.AstNode
