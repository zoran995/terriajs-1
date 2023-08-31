import { action } from "mobx";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import MiniMap from "../../Models/MiniMap/MiniMap";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

interface MiniMapPanelProps {
  terria: Terria;
}

const MiniMapPanel: React.FC<MiniMapPanelProps> = ({ terria }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(
    action(() => {
      if (containerRef) {
        const viewer = new MiniMap(terria, containerRef);
        return () => viewer.destroy();
      }
    }),
    [terria.mainViewer]
  );

  return (
    <StyledMiniMapContainer>
      <MapContainer ref={containerRef} />
    </StyledMiniMapContainer>
  );
};

const MapContainer = styled.div`
  border-radius: 4px 0 0 0;
  border-top: 2px solid ${(props) => props.theme.textLight};
  border-left: 2px solid ${(props) => props.theme.textLight};
`;

const StyledMiniMapContainer = styled.div`
  width: 180px;
  height: 180px;
  position: absolute;
  display: none;
  background: unset;
  box-shadow: -2px 2px 4px 0 rgba(0, 0, 0, 0.15);
  @media (min-width: ${(props) => props.theme.sm}px) {
    bottom: 25px;
    right: -2px;
    display: block;
  }
  & .leaflet-control-attribution {
    display: none;
  }
`;

export default MiniMapPanel;
