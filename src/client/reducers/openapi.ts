import * as types from '../actions/actionTypes';
import parseOpenapiDocument from '../controllers/openapiController';

const initialState = {
  // ...state,
  currentTab: 'First Tab',
  reqResArray: [],
  scheduledReqResArray: [],
  history: [],
  collections: [],
  warningMessage: {},
  metadataOAI: {
    info: {},
    tags: [],
    serverUrls: [],
  },
  newRequestFields: {
    protocol: 'openAPI',
    graphQL: false,
    gRPC: false,
    ws: false,
    webrtc: false,
    url: 'http://',
    method: 'GET',
    network: 'rest',
    testContent: '',
    testResults: [],
  },
  newRequestHeaders: {
    headersArr: [],
    count: 0,
  },
  newRequestCookies: {
    cookiesArr: [],
    count: 0,
  },
  newRequestBody: {
    bodyContent: '',
    bodyVariables: '',
    bodyType: 'raw',
    rawType: 'text/plain',
    JSONFormatted: true,
    bodyIsNew: false,
  },
};

// {
//   'id': 13,
//   enabled: true, // user toggles state
//   tags: ["Users"],
//   method: "post",
//   headers: [],
//   urls: ['http://api.twitter.com/2/users/13/blocking',
//   'http://api.twitter.com/2/users/240/blocking',
//   'http://api.twitter.com/2/users/24/blocking?required=false&TZ=utc%159'],
//   body: userInput.body// JSON, user text input
//   ,summary, description, operationId,
// }

// var info, tags, reqTags, reqResArray, reqResObj, urls, method, headers, body,
const openapiReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.IMPORT_OAI_DOCUMENT: {
      const { info, tags, serverUrls, reqResArray } = parseOpenapiDocument(
        action.payload
      );
      return {
        ...state,
        metadataOAI: { info, tags, serverUrls },
        reqResArray,
      };
    }
    case types.SET_OAI_SERVERS_GLOBAL: {
      const metadataOAI = { ...state.metadataOAI };
      metadataOAI.serverUrls = [...state.metadataOAI.serverUrls].filter(
        (_, i) => action.payload.includes(i)
      );
      return {
        ...state,
        metadataOAI,
      };
    }
    case types.SET_OAI_SERVERS: {
      const { id, serverIds } = action.payload;
      const request = [...state.reqResArray]
        .filter(({ request }) => request.id === id)
        .pop() as Record<string, unknown>;
      request.reqServers = [...state.metadataOAI.serverUrls].filter((_, i) =>
        serverIds.includes(i)
      );
      const reqResArray = [...state.reqResArray].push({ request });
      return {
        ...state,
        reqResArray,
      };
    }
    case types.SET_NEW_OAI_PARAMETER: {
      const { id, type, key, value } = action.payload;
      const request = [...state.reqResArray]
        .filter(({ request }) => request.id === id)
        .pop() as Record<string, unknown>;
      const urls = [...(request.reqServers as string[])].map(
        (url) => (url += request.endpoint)
      );
      switch (type) {
        case 'path': {
          urls.map((url) => url.replace(`{${key}}`, value));
          request.urls = urls;
          const reqResArray = [...state.reqResArray].push({ request });
          return {
            ...state,
            reqResArray,
          };
        }
        case 'query': {
          urls.map((url) => {
            if (url.slice(-1) !== '?') url += '?';
            url += `${key}=${value}&`;
          });
          request.urls = urls;
          const reqResArray = [...state.reqResArray].push({ request });
          return {
            ...state,
            reqResArray,
          };
        }
        default: {
          return state;
        }
      }
    }
    case types.SET_NEW_OAI_REQUEST_BODY: {
      const { id, mediaType, requestBody } = action.payload;
      const request = [...state.reqResArray]
        .filter(({ request }) => request.id === id)
        .pop() as Record<string, unknown>;
      const { method } = request as Record<string, string>;
      if (
        !['get', 'delete', 'head'].includes(method) &&
        requestBody !== undefined
      ) {
        const body = new Map(mediaType);
        body.set(mediaType, requestBody) as Map<string, unknown>;
        request.body = body;
      }
      const reqResArray = [...state.reqResArray].push({ request });
      return {
        ...state,
        reqResArray,
      };
    }
    case types.SEND_OAI_REQUESTS: {
      const reqResArray = [...state.reqResArray].filter(
        ({ request }) => request.enabled
      );
      return {};
    }
    default: {
      return state;
    }
  }
};

export default openapiReducer;
