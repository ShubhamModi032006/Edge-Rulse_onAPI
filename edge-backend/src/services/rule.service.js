
const rules = [];

export const createRuleService = (ruleData) => {
    const newRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...ruleData,
        createdAt: new Date().toISOString()
    };
    rules.push(newRule);
    return newRule;
};

export const listRulesService = () => {
    return rules;
};
