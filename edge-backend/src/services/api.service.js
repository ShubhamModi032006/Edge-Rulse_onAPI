
const apis = [];

export const registerApiService = (apiData) => {
    const newApi = {
        id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...apiData,
        createdAt: new Date().toISOString()
    };
    apis.push(newApi);
    return newApi;
};

export const listApisService = () => {
    return apis;
};
