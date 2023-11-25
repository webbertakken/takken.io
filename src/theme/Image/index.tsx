import React from 'react';
import styles from './index.module.css';

interface Props {
  src: string;
  alt: string;
  year?: number;
}

const Image = ({ src, alt, year, ...props }: Props): JSX.Element => {
  return (
    <div className={styles.wrapper}>
      <img className={styles.image} {...props} src={src} alt={alt} />
      {alt && (
        <em className={styles.title}>
          {alt}
          {year && ` (${year})`}.
        </em>
      )}
    </div>
  );
};

export default Image;
