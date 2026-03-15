import * as React from 'react'

import type {AlertDialogBackdropProps as AlertDialogBackdropPrimitiveProps, AlertDialogCloseProps as AlertDialogClosePrimitiveProps, AlertDialogDescriptionProps as AlertDialogDescriptionPrimitiveProps, AlertDialogFooterProps as AlertDialogFooterPrimitiveProps, AlertDialogHeaderProps as AlertDialogHeaderPrimitiveProps, AlertDialogPopupProps as AlertDialogPopupPrimitiveProps, AlertDialogProps as AlertDialogPrimitiveProps, AlertDialogTitleProps as AlertDialogTitlePrimitiveProps, AlertDialogTriggerProps as AlertDialogTriggerPrimitiveProps} from '@/components/animate-ui/primitives/base/alert-dialog';
import {
  AlertDialogBackdrop as AlertDialogBackdropPrimitive,
  
  AlertDialogClose as AlertDialogClosePrimitive,
  
  AlertDialogDescription as AlertDialogDescriptionPrimitive,
  
  AlertDialogFooter as AlertDialogFooterPrimitive,
  
  AlertDialogHeader as AlertDialogHeaderPrimitive,
  
  AlertDialogPopup as AlertDialogPopupPrimitive,
  
  AlertDialogPortal as AlertDialogPortalPrimitive,
  AlertDialog as AlertDialogPrimitive,
  
  AlertDialogTitle as AlertDialogTitlePrimitive,
  
  AlertDialogTrigger as AlertDialogTriggerPrimitive
  
} from '@/components/animate-ui/primitives/base/alert-dialog'
import { buttonVariants } from '@/components/animate-ui/components/buttons/button'
import { cn } from '@/lib/utils'

type AlertDialogProps = AlertDialogPrimitiveProps

function AlertDialog(props: AlertDialogProps) {
  return <AlertDialogPrimitive {...props} />
}

type AlertDialogTriggerProps = AlertDialogTriggerPrimitiveProps

function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  return <AlertDialogTriggerPrimitive {...props} />
}

type AlertDialogBackdropProps = AlertDialogBackdropPrimitiveProps

function AlertDialogBackdrop({
  className,
  ...props
}: AlertDialogBackdropProps) {
  return (
    <AlertDialogBackdropPrimitive
      className={cn('fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  )
}

type AlertDialogPopupProps = AlertDialogPopupPrimitiveProps

function AlertDialogPopup({ className, ...props }: AlertDialogPopupProps) {
  return (
    <AlertDialogPortalPrimitive>
      <AlertDialogBackdrop />
      <AlertDialogPopupPrimitive
        className={cn(
          'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortalPrimitive>
  )
}

type AlertDialogHeaderProps = AlertDialogHeaderPrimitiveProps

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return (
    <AlertDialogHeaderPrimitive
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

type AlertDialogFooterProps = AlertDialogFooterPrimitiveProps

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
  return (
    <AlertDialogFooterPrimitive
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

type AlertDialogTitleProps = AlertDialogTitlePrimitiveProps

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogTitlePrimitive
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

type AlertDialogDescriptionProps = AlertDialogDescriptionPrimitiveProps

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialogDescriptionPrimitive
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

type AlertDialogActionProps = AlertDialogClosePrimitiveProps

function AlertDialogAction({ className, ...props }: AlertDialogActionProps) {
  return (
    <AlertDialogClosePrimitive
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

type AlertDialogCancelProps = AlertDialogClosePrimitiveProps

function AlertDialogCancel({ className, ...props }: AlertDialogCancelProps) {
  return (
    <AlertDialogClosePrimitive
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogProps,
  type AlertDialogTriggerProps,
  type AlertDialogPopupProps,
  type AlertDialogHeaderProps,
  type AlertDialogFooterProps,
  type AlertDialogTitleProps,
  type AlertDialogDescriptionProps,
  type AlertDialogActionProps,
  type AlertDialogCancelProps,
}
