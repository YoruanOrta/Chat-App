import { connect } from 'react-redux';
import { addMessage } from '../actions';
import AddMessage from '../components/AddMessage';
import MessagesList from '../components/MessagesList';
import Sidebar from '../components/Sidebar';
import Chance from 'chance';

const chance = new Chance();
const username = chance.name();

// MapStateToProps para MessagesList
const mapStateToPropsMessages = (state) => ({
  messages: state.messages
});

// MapStateToProps para Sidebar
const mapStateToPropsSidebar = (state) => ({
  users: state.users
});

// MapDispatchToProps para AddMessage
const mapDispatchToPropsAddMessage = (dispatch) => ({
  onSubmit: (message) => {
    dispatch(addMessage(message, username));
  }
});

// Contenedores conectados a Redux
export const AddMessageContainer = connect(
  null,
  mapDispatchToPropsAddMessage
)(AddMessage);

export const MessagesListContainer = connect(
  mapStateToPropsMessages
)(MessagesList);

export const SidebarContainer = connect(
  mapStateToPropsSidebar
)(Sidebar);

// Exportar el username para usarlo en otros componentes
export { username };