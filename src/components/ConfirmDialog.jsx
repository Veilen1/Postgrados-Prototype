import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

export default function ConfirmDialog({ open, title, content, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={() => onClose(false)} aria-labelledby="confirm-dialog-title">
      <DialogTitle id="confirm-dialog-title">{title || 'Confirmar'}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancelar</Button>
        <Button onClick={() => { onConfirm && onConfirm(); onClose(true) }} variant="contained">Confirmar</Button>
      </DialogActions>
    </Dialog>
  )
}
