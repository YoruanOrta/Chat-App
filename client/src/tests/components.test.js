import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Message from '../components/Message';
import MessagesList from '../components/MessagesList';
import Sidebar from '../components/Sidebar';
import AddMessage from '../components/AddMessage';

describe('Components', () => {
  describe('Message', () => {
    it('renders message with author', () => {
      render(<Message message="Hello" author="John" />);
      expect(screen.getByText(/John:/)).toBeInTheDocument();
      expect(screen.getByText(/Hello/)).toBeInTheDocument();
    });
  });

  describe('MessagesList', () => {
    it('renders list of messages', () => {
      const messages = [
        { id: 1, message: 'Hello', author: 'John' },
        { id: 2, message: 'Hi', author: 'Jane' }
      ];
      render(<MessagesList messages={messages} />);
      expect(screen.getByText(/John:/)).toBeInTheDocument();
      expect(screen.getByText(/Jane:/)).toBeInTheDocument();
    });

    it('renders empty list', () => {
      render(<MessagesList messages={[]} />);
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });
  });

  describe('Sidebar', () => {
    it('renders users list', () => {
      const users = ['Alice', 'Bob', 'Charlie'];
      render(<Sidebar users={users} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  describe('AddMessage', () => {
    it('submits message on form submit', () => {
      const handleSubmit = jest.fn();
      render(<AddMessage onSubmit={handleSubmit} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      const button = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalledWith('Test message');
    });

    it('clears input after submit', () => {
      const handleSubmit = jest.fn();
      render(<AddMessage onSubmit={handleSubmit} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.submit(input.closest('form'));
      
      expect(input.value).toBe('');
    });
  });
});