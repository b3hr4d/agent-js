import { shallow, mount } from 'enzyme';
import * as React from "react";
import { Ed25519KeyIdentity } from '@dfinity/authentication';
import { hexEncodeUintArray } from '../../bytes';
import * as reducer from "./reducer";

describe('@dfinity/identity-provider/design-phase-0/reducer', () => {
    it('works', () => {
        const sessionId = Ed25519KeyIdentity.generate();
        const Component = () => {
            const initialState = reducer.init()
            const [state, dispatch] = React.useReducer(reducer.reduce, initialState, reducer.init);
            React.useEffect(
                () => {
                    dispatch({
                        type: "AuthenticationRequestReceived",
                        payload: {
                            type: "AuthenticationRequest",
                            sessionIdentity: {
                                hex: hexEncodeUintArray(sessionId.getPublicKey().toDer())
                            },
                            redirectUri: new URL("https://identity-provider.sdk-test.dfinity.network/relying-party-demo/oauth/redirect_uri").toString(),
                        }
                    })
                },
                [],
            )
            return <>
                <span data-test-id="loginHint">{state.delegation?.target?.publicKey.hex}</span>
            </>
            return <pre>{JSON.stringify(state)}</pre>
        }
        const el = mount(<Component />)
        expect(el.find('[data-test-id="loginHint"]').text()).toContain(hexEncodeUintArray(sessionId.getPublicKey().toDer()))
    })
});
