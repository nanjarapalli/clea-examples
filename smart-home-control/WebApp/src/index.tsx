import React from "react";
import ReactDOM from "react-dom";
import { IntlProvider } from "react-intl";

import AstarteClient from "./AstarteClient";

// @ts-ignore
import appStyle from "./index.css";

import en from "./lang/en.json";
import it from "./lang/it.json";
import Dashboard from "./Dashboard";
import { Config } from "./Components/Common";
import Spinner from "./Components/Spinner";

const messages = { en, it };

const { useEffect, useMemo, useState } = React;

type InterfaceVersion = {
  major: number;
  minor: number;
};

type Introspection = Record<string, InterfaceVersion>;

type AppProps = {
  astarteUrl: URL;
  realm: string;
  token: string;
  deviceId: string;
};

const App = ({ astarteUrl, realm, token, deviceId }: AppProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetching, setDataFetching] = useState(false);
  const [data, setData] = useState<Config>({} as Config);
  const [introspection, setIntrospection] = useState<Introspection | null>(
    null
  );
  const astarteClient = useMemo(() => {
    return new AstarteClient({ astarteUrl, realm, token });
  }, [astarteUrl, realm, token]);

  const handleValueChange = (endpoint: string, value: boolean | number) => {
    astarteClient
    .postStreamData({
      deviceId,
      endpoint,
      value
    });
  };
  const handleChannelEvent = (e: {
    event: { interface: string; value: Object };
    timestamp: string;
  }) => {
    astarteClient
      .getHomeDashboard({
        deviceId
      })
      .then(setData)
      .catch(() => setData({} as Config))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    astarteClient
      .getIntrospection({ deviceId })
      .then(async (data) => {
        setIntrospection(data);
      })
      .catch(() => setIntrospection(null));
  }, []);

  useEffect(() => {
    if (!introspection) {
      return;
    }
    astarteClient
      .getHomeDashboard({
        deviceId
      })
      .then(setData)
      .catch(() => setData({} as Config))
      .finally(() => setIsLoading(false));

    // Web Sockets
    const salt = Math.floor(Math.random() * 10000);
    const roomName = `dashboard_${deviceId}_${salt}`;
    astarteClient
      .joinRoom(roomName)
      .then(() => {
        astarteClient.listenForEvents(roomName, handleChannelEvent);

        const deviceDataTriggerPayload = {
          name: `deviceDataTrigger-${deviceId}`,
          device_id: deviceId,
          simple_trigger: {
            type: "data_trigger",
            on: "incoming_data",
            interface_name: 'ai.clea.examples.smart.home.Data',
            interface_major: introspection['ai.clea.examples.smart.home.Data'].major,
            match_path: `/*`,
            value_match_operator: "*",
          },
        };

        astarteClient
          .registerVolatileTrigger(roomName, deviceDataTriggerPayload)
          .then(() => {
            console.log(
              `Watching for ${'ai.clea.examples.smart.home.Data'} v${introspection['ai.clea.examples.smart.home.Data'].major} events`
            );
          })
          .catch(() => {
            console.log(`Coulnd't watch for deviceData events`);
          });
      })
      .catch(() => {
        console.log(`Couldn't join device ${deviceId} room`);
      });
  }, [introspection]);

  return (
    <div className="pt-2 pb-2">
      {isLoading ? (
        <div>
          <Spinner />
        </div>
      ) : (
        <Dashboard
          data={data}
          dataFetching={dataFetching}
          handleOnChange={handleValueChange}
        ></Dashboard>
      )}
    </div>
  );
};

type UserPreferences = {
  language: "en" | "it";
};

type Settings = {
  themeUrl: string;
  userPreferences: UserPreferences;
};

const AppLifecycle = {
  mount: (container: ShadowRoot, appProps: AppProps, settings: Settings) => {
    const { themeUrl, userPreferences } = settings;
    const { language } = userPreferences;

    ReactDOM.render(
      <>
        <link href={themeUrl} type="text/css" rel="stylesheet" />
        <style>{appStyle.toString()}</style>
        <IntlProvider
          messages={messages[language]}
          locale={language}
          defaultLocale="en"
        >
          <App {...appProps} />
        </IntlProvider>
      </>,
      container
    );
  },
  unmount: (container: ShadowRoot) =>
    ReactDOM.unmountComponentAtNode(container),
};

export default AppLifecycle;
