import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:data-[type=error]:!bg-destructive/10 group-[.toaster]:data-[type=error]:!text-destructive group-[.toaster]:data-[type=error]:!border-destructive/30 group-[.toaster]:data-[type=success]:!bg-forest/10 group-[.toaster]:data-[type=success]:!text-forest group-[.toaster]:data-[type=success]:!border-forest/30",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
