import Image from "next/image";
import loadingDark from "./loading-dark.svg";
import loadingLight from "./loading-light.svg";
import styles from "./loading.module.css";

export enum LoadingVariant {
  Primary = "primary",
  Secondary = "secondary",
  Light = "light",
  Destructive = "destructive",
}

export enum LoadingSize {
  Small = "sm",
  Medium = "md",
  Large = "lg",
}

export const Loading = () => {
  return (
    <div className={styles.LoadingContainer}>
      <div className={styles.ImageContainer}>
        <Image
          src={loadingDark}
          alt="Verve Pay Logo"
          className={styles.LoadingDark}
          width={32}
          height={32}
          priority
        />
        <Image
          src={loadingLight}
          alt="Verve Pay Logo"
          className={styles.LoadingLight}
          width={32}
          height={32}
          priority
        />
      </div>
    </div>
  );
};

const getVariant = (variant: LoadingVariant | undefined) => {
  let className;
  switch (variant) {
    case LoadingVariant.Primary:
      className = "border-primary-600 text-primary-600";
      break;
    case LoadingVariant.Secondary:
      className = "border-gray-300 text-gray-700";
      break;
    case LoadingVariant.Light:
      className = "border-white text-white";
      break;
    case LoadingVariant.Destructive:
      className = "border-error-50 text-error-700";
      break;
  }

  return className;
};

const getSize = (size: LoadingSize | undefined) => {
  let className;
  switch (size) {
    case LoadingSize.Small:
      className = "h-3 w-3";
      break;
    case LoadingSize.Medium:
      className = "h-5 w-5";
      break;
    case LoadingSize.Large:
      className = "h-7 w-7";
      break;
  }

  return className;
};

export const LoadingSpinner = ({
  variant,
  size = LoadingSize.Medium,
}: {
  variant: LoadingVariant;
  size?: LoadingSize;
}) => {
  return (
    <svg
      className={`animate-spin ${getSize(size)} ${getVariant(variant)}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};
