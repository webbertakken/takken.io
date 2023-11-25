import React from 'react';
import styles from './index.module.css';

interface Props {
  src: string;
  performer?: {
    name: string;
  };
  isSong?: boolean;
}

const PoemAudio = (props: Props): JSX.Element => {
  const { performer, isSong, ...audioProps } = props;
  return (
    <div className={styles.main}>
      <audio controls className={styles.audio} {...audioProps} />
      {isSong ? (
        <em>Lied. {performer ? `Gezongen door ${performer.name}.` : ''}</em>
      ) : (
        <em>Audioversie. {performer ? `Voorgelezen door ${performer.name}.` : ''}</em>
      )}
    </div>
  );
};

export default PoemAudio;
