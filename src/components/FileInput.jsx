import React from 'react'
import { Button } from '@mui/material'

export default function FileInput({ id, onChange, accept }) {
  return (
    <div>
      <input id={id} type="file" accept={accept} style={{ display: 'none' }} onChange={onChange} />
      <label htmlFor={id}>
        <Button variant="outlined" component="span">Subir archivo</Button>
      </label>
    </div>
  )
}
