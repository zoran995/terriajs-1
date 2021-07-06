"use strict";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";

import Timer from "../../Generic/Timer/Timer";
import { useTranslation } from "react-i18next";

import AutoRefreshingMixin from "./../../../ModelMixins/AutoRefreshingMixin";
import isDefined from "./../../../Core/isDefined";
import Box, { BoxSpan } from "./../../../Styled/Box";
import Spacing from "../../../Styled/Spacing";
import { useTheme } from "styled-components";
import { TextSpan } from "../../../Styled/Text";

interface ITimerSection {
  item: AutoRefreshingMixin.Instance; //AutoRefreshingMixin;
}

const TimerSection: React.FC<ITimerSection> = observer(
  ({ item }: ITimerSection) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    let interval: NodeJS.Timeout;

    let nextUpdate: Date | undefined;

    useEffect(() => {
      console.log("item.refreshInterval");
      setIsEnabled(
        !!(
          isDefined(item) &&
          item.isPolling &&
          isDefined(item.nextScheduledUpdateTime) &&
          item.refreshInterval &&
          // only show refresh timer for refresh intervals less than 30 minutes
          item.refreshInterval < 30 * 60 * 1000
        )
      );
    }, [item.refreshInterval]);

    useEffect(() => {
      startCountdown();
    }, []);

    useEffect(() => {
      if (nextUpdate !== item.nextScheduledUpdateTime) {
        intervalClear();
        startCountdown();
        nextUpdate = item.nextScheduledUpdateTime;
      }

      // Clear interval if the component is unmounted
      return () => intervalClear();
    }, [item.nextScheduledUpdateTime]);

    function intervalClear() {
      if (isDefined(interval)) {
        clearInterval(interval);
      }
    }

    function countdown() {
      setSecondsLeft(oldSeconds => {
        if (oldSeconds > 0) {
          return oldSeconds - 1;
        } else {
          clearInterval();
          return getCountdownDuration();
        }
      });
    }

    function startCountdown() {
      const duration = getCountdownDuration();
      setSecondsLeft(duration);
      interval = setInterval(countdown, 1000);
    }

    function getCountdownDuration() {
      // How many seconds until our next update?
      return Math.floor(
        (item.nextScheduledUpdateTime!.getTime() - new Date().getTime()) / 1000
      );
    }

    function getTimerStartTime() {
      const date = new Date(item.nextScheduledUpdateTime!);
      date.setSeconds(date.getSeconds() - item.refreshInterval!);
      return date;
    }

    function getCountdownString() {
      const date = new Date(+0);
      date.setSeconds(secondsLeft);
      const addLeadingZeroIfRequired = (numString: string) =>
        numString.length < 2 ? "0" + numString : numString;

      const minutes = addLeadingZeroIfRequired(date.getMinutes().toString());
      const seconds = addLeadingZeroIfRequired(date.getSeconds().toString());

      return `00:${minutes}:${seconds}`;
    }

    if (!isEnabled) {
      return null;
    }

    return (
      <>
        <Spacing bottom={3} />
        <Box backgroundColor={theme.overlay} paddedRatio={2}>
          <Box>
            <Timer
              tooltipText={t("timer.nextScheduledUpdateTime", {
                scheduledUpdateTime: item.nextScheduledUpdateTime
              })}
              radius={10}
              start={getTimerStartTime().getTime()}
              stop={item.nextScheduledUpdateTime!.getTime()}
            />
          </Box>
          <Spacing right={2} />
          <TextSpan medium light>
            {t("timer.nextScheduledUpdateCountdown", {
              timeCountdown: getCountdownString()
            })}
          </TextSpan>
        </Box>
      </>
    );
  }
);

export default TimerSection;
