import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';


const link = createHttpLink({
  uri: 'http://localhost:5000/',
  credentials: 'include'
});



const client = new ApolloClient({
  cache: new InMemoryCache(),
  link

});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);

