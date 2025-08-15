import React from 'react';
import DocItem from '@theme-original/DocItem';
import DocRating from '../DocRating';

export default function DocItemWrapper(props) {
  return (
    <>
      <DocItem {...props} />
      <div className="row">
        <div className="col docItemCol_VOVn">
          <div className="docItemContainer_Djhp">
            <DocRating />
          </div>
        </div>
      </div>
    </>
  );
}
