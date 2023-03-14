import React, { useState } from 'react'
import { useMutation, gql } from '@apollo/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const USER_LOGIN = gql`
    mutation Login($input: CreateUserInput!) {
      Login(input: $input) {
        __typename
        ...on User {
            id
            email
        }
        ... on Error {
            path 
            message
        }
    }
}
  `
  const [Login, { data, loading }] = useMutation(USER_LOGIN);
  
  async function handleSubmit(event) {
    event.preventDefault();

    await Login({ variables: { "input": { "email": email, "password": password } } })
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
       
      <label>Email:</label>
      <input type="email" value={email} onChange={event => setEmail( event.target.value )} />

      <label>password:</label>
      <input type="password" value={password} onChange={event => setPassword(event.target.value)} />


      <button type="submit">Submit</button>
      <a href="http://localhost:5000/auth/google">Google login</a>
      </form>
      <h1>{!loading && data ? data.Login.message : ""}</h1>
      </div>
    )
}

export default Login