import { runInAction } from "mobx";
import React from "react";
import AugmentedVirtuality from "../../../Models/AugmentedVirtuality";
import HistoryControls from "../../../Models/HistoryControls/HistoryControls";
import {
  HistoryControlsControllerBack,
  HistoryControlsControllerForward
} from "../../../Models/HistoryControls/HistoryControlsController";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../../Styled/Icon";
import { GenericMapNavigationItemController } from "../../../ViewModels/MapNavigation/MapNavigationItemController";
import {
  FeedbackButtonController,
  FEEDBACK_TOOL_ID
} from "../../Feedback/FeedbackButtonController";
import { DkpSearchToolController } from "../../Tools/DkpSearch/DkpSeachToolController";
import { DKP_SEARCH_ID } from "../../Tools/DkpSearch/DkpSearch";
import DrawingToolPanel, {
  DRAWING_TOOL_ID
} from "../../Tools/DrawingTool/DrawingToolPanel";
import MeasureToolPanel, {
  MEASURE_TOOL_ID
} from "../../Tools/MeasureTool/MeasureToolPanel";
import PedestrianMode, {
  PEDESTRIAN_MODE_ID
} from "../../Tools/PedestrianMode/PedestrianMode";
import { ToolButtonController } from "../../Tools/Tool";
import {
  AR_TOOL_ID,
  AugmentedVirtualityController,
  AugmentedVirtualityHoverController,
  AugmentedVirtualityRealign,
  AugmentedVirtualityRealignController,
  CloseToolButton,
  Compass,
  COMPASS_TOOL_ID,
  MeasureTool,
  MyLocation,
  ToggleSplitterController,
  ZoomControl,
  ZOOM_CONTROL_ID
} from "./Items";

export const CLOSE_TOOL_ID = "close-tool";

export const registerMapNavigations = (viewState: ViewState) => {
  const terria = viewState.terria;
  const mapNavigationModel = terria.mapNavigationModel;

  const compassController = new GenericMapNavigationItemController({
    viewerMode: ViewerMode.Cesium,
    icon: GLYPHS.compassInnerArrows
  });
  compassController.pinned = true;
  mapNavigationModel.addItem({
    id: COMPASS_TOOL_ID,
    name: "translate#compass",
    controller: compassController,
    location: "TOP",
    order: 1,
    screenSize: "medium",
    render: <Compass terria={terria} viewState={viewState} />
  });

  const zoomToolController = new GenericMapNavigationItemController({
    viewerMode: undefined,
    icon: GLYPHS.zoomIn
  });
  zoomToolController.pinned = true;
  mapNavigationModel.addItem({
    id: ZOOM_CONTROL_ID,
    name: "translate#zoom",
    controller: zoomToolController,
    location: "TOP",
    order: 2,
    screenSize: "medium",
    render: <ZoomControl terria={terria} />
  });

  const myLocation = new MyLocation({ terria });
  mapNavigationModel.addItem({
    id: MyLocation.id,
    name: "translate#location.location",
    title: "translate#location.centreMap",
    location: "TOP",
    controller: myLocation,
    screenSize: undefined,
    order: 3
  });

  const toggleSplitterController = new ToggleSplitterController(viewState);
  mapNavigationModel.addItem({
    id: ToggleSplitterController.id,
    name: "translate#splitterTool.toggleSplitterToolTitle",
    title: runInAction(() =>
      toggleSplitterController.disabled
        ? "translate#splitterTool.toggleSplitterToolDisabled"
        : "translate#splitterTool.toggleSplitterTool"
    ),
    location: "TOP",
    controller: toggleSplitterController,
    screenSize: undefined,
    order: 4
  });

  if (
    !terria.configParameters.disableDkpSearch ||
    terria.configParameters.dkpSearchInNavigation
  ) {
    const dkpSearchToolController = new DkpSearchToolController(viewState);

    mapNavigationModel.addItem({
      id: DKP_SEARCH_ID,
      name: "translate#dkpSearch.title",
      title: "translate#dkpSearch.title",
      location: "TOP",
      screenSize: "medium",
      controller: dkpSearchToolController,
      order: 5
    });
  }

  const measureToolController = new ToolButtonController({
    toolName: MEASURE_TOOL_ID,
    viewState: viewState,
    getToolComponent: () => MeasureToolPanel as any,
    icon: GLYPHS.measure
  });
  mapNavigationModel.addItem({
    id: MEASURE_TOOL_ID,
    name: "translate#measureTool.button",
    title: "translate#measureTool.button",
    location: "TOP",
    screenSize: "medium",
    controller: measureToolController,
    order: 6
  });

  const measureToolSmall = new MeasureTool({
    terria,
    onClose: () => {
      runInAction(() => {
        viewState.panel = undefined;
      });
    }
  });
  mapNavigationModel.addItem({
    id: MeasureTool.id,
    name: "translate#measure.measureToolTitle",
    title: "translate#measure.measureDistance",
    location: "TOP",
    controller: measureToolSmall,
    screenSize: "small",
    order: 7
  });

  const drawingToolController = new ToolButtonController({
    toolName: DRAWING_TOOL_ID,
    viewState: viewState,
    getToolComponent: () => DrawingToolPanel as any,
    icon: GLYPHS.pen
  });
  mapNavigationModel.addItem({
    id: DRAWING_TOOL_ID,
    name: "translate#drawingTool.button",
    title: "translate#drawingTool.button",
    location: "TOP",
    screenSize: "medium",
    controller: drawingToolController,
    order: 8
  });

  const historyControls = new HistoryControls(terria);

  const historyBackController = new HistoryControlsControllerBack(
    historyControls
  );
  mapNavigationModel.addItem({
    id: "GoBack",
    name: "translate#historyControl.back",
    title: "translate#historyControl.backTitle",
    location: "TOP",
    screenSize: undefined,
    controller: historyBackController,
    order: 9
  });

  const historyForwardController = new HistoryControlsControllerForward(
    historyControls
  );
  mapNavigationModel.addItem({
    id: "GoForward",
    name: "translate#historyControl.forward",
    title: "translate#historyControl.forwardTitle",
    location: "TOP",
    screenSize: undefined,
    controller: historyForwardController,
    order: 10
  });

  const pedestrianModeToolController = new ToolButtonController({
    toolName: PEDESTRIAN_MODE_ID,
    viewState: viewState,
    getToolComponent: () => PedestrianMode as any,
    icon: GLYPHS.pedestrian,
    viewerMode: ViewerMode.Cesium
  });
  mapNavigationModel.addItem({
    id: PEDESTRIAN_MODE_ID,
    name: "translate#pedestrianMode.toolButtonTitle",
    title: "translate#pedestrianMode.toolButtonTitle",
    location: "TOP",
    screenSize: "medium",
    controller: pedestrianModeToolController,
    order: 11
  });

  const closeToolButtonController = new GenericMapNavigationItemController({
    handleClick: () => {
      viewState.closeTool();
    },
    icon: GLYPHS.closeLight
  });
  mapNavigationModel.addItem({
    id: CLOSE_TOOL_ID,
    name: "translate#close",
    location: "TOP",
    screenSize: undefined,
    controller: closeToolButtonController,
    render: <CloseToolButton />,
    order: 12
  });
  closeToolButtonController.setVisible(false);

  const augmentedVirtuality = new AugmentedVirtuality(terria);
  const arController = new AugmentedVirtualityController({
    terria: terria,
    viewState: viewState,
    augmentedVirtuality: augmentedVirtuality
  });
  mapNavigationModel.addItem({
    id: AR_TOOL_ID,
    name: "translate#AR.arTool",
    location: "TOP",
    screenSize: "small",
    controller: arController,
    order: 0,
    noExpand: true
  });

  const arControllerHover = new AugmentedVirtualityHoverController({
    augmentedVirtuality: augmentedVirtuality
  });
  mapNavigationModel.addItem({
    id: `${AR_TOOL_ID}_hover`,
    name: "translate#AR.btnHover",
    location: "TOP",
    screenSize: "small",
    controller: arControllerHover,
    order: 1,
    noExpand: true
  });

  const arRealignController = new AugmentedVirtualityRealignController({
    terria: terria,
    viewState: viewState,
    augmentedVirtuality: augmentedVirtuality
  });
  mapNavigationModel.addItem({
    id: `${AR_TOOL_ID}_realign`,
    name: runInAction(() =>
      augmentedVirtuality.manualAlignmentSet
        ? "translate#AR.btnRealign"
        : "translate#AR.btnResetRealign"
    ),
    location: "TOP",
    screenSize: "small",
    controller: arRealignController,
    render: (
      <AugmentedVirtualityRealign arRealignController={arRealignController} />
    ),
    order: 1,
    noExpand: true
  });

  const feedbackController = new FeedbackButtonController(viewState);
  mapNavigationModel.addItem({
    id: FEEDBACK_TOOL_ID,
    name: "translate#feedback.feedbackBtnText",
    title: "translate#feedback.feedbackBtnText",
    location: "BOTTOM",
    screenSize: "medium",
    controller: feedbackController,
    order: 13
  });
};
