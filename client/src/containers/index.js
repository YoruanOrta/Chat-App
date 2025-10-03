import { connect } from 'react-redux';
import { addMessage } from '../actions';
import AddMessage from '../components/AddMessage';
import MessagesList from '../components/MessagesList';
import Sidebar from '../components/Sidebar';

export const AddMessageContainer = connect(
  null,
  (dispatch, ownProps) => ({
    onSubmit: (message) => dispatch(addMessage(message, ownProps.username))
  })
)(AddMessage);

export const MessagesListContainer = connect(
  state => ({ messages: state.messages })
)(MessagesList);

export const SidebarContainer = connect(
  state => ({ users: state.users })
)(Sidebar);