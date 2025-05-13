
import React from 'react';

type MotionProps = {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  transition?: Record<string, any>;
  children: React.ReactNode;
  className?: string;
};

// This is a simplified version of framer-motion's motion component
// For more complex animations, we would use framer-motion
export const motion = {
  div: ({
    initial,
    animate,
    transition,
    children,
    className,
    ...props
  }: MotionProps) => {
    const [style, setStyle] = React.useState(initial);

    React.useEffect(() => {
      if (animate) {
        const timer = setTimeout(() => {
          setStyle(animate);
        }, 10);
        return () => clearTimeout(timer);
      }
    }, [animate]);

    const transitionStyle = transition
      ? {
          transition: `all ${transition.duration || 0.3}s ${
            transition.ease || 'ease'
          }`,
        }
      : {};

    return (
      <div
        className={className}
        style={{
          ...style,
          ...transitionStyle,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
};
