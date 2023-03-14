import React from 'react'
import { useQuery, gql } from '@apollo/client';

const Cart = () => {
    const LOGIN_USER = gql`
    query {
    carts {
      cartItem {
          product {
              name
              quantity
              price
              image
          }
          quantity
      }
    }
}
`


  const { data, error, loading } = useQuery(LOGIN_USER)
  
    if (loading || !data) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  const listItems = data.carts.map((d) =>
    <li key={d.name}>
      {d.cartItem.product.name} - {d.cartItem.product.price} - {d.cartItem.quantity} 
    </li>);

  return (
    <>
      <h1>Hello world</h1>
      <ul>
        {listItems}
      </ul>
    </>
  )
}

export default Cart