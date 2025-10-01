import chatApp from '../reducers';
import { addMessage, messageReceived, usersList } from '../actions';

describe('Reducers', () => {
  it('should return the initial state', () => {
    const state = chatApp(undefined, {});
    expect(state).toEqual({
      messages: [],
      users: []
    });
  });

  it('should handle ADD_MESSAGE', () => {
    const state = chatApp(undefined, addMessage('Hello', 'John'));
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].message).toBe('Hello');
    expect(state.messages[0].author).toBe('John');
  });

  it('should handle MESSAGE_RECEIVED', () => {
    const state = chatApp(undefined, messageReceived('Hi there', 'Jane'));
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].message).toBe('Hi there');
    expect(state.messages[0].author).toBe('Jane');
  });

  it('should handle USERS_LIST', () => {
    const users = ['Alice', 'Bob'];
    const state = chatApp(undefined, usersList(users));
    expect(state.users).toEqual(users);
  });

  it('should handle multiple messages', () => {
    let state = chatApp(undefined, addMessage('First', 'User1'));
    state = chatApp(state, addMessage('Second', 'User2'));
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].message).toBe('Second');
  });
});