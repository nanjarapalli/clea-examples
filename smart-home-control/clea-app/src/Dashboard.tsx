/*
   Copyright 2022 SECO Mind Germany GmbH

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React, { useEffect, useState } from "react";
import { Stack, Card, Row, Col, Container, Form, Image } from "react-bootstrap";
import { Config } from "./Components/Common";
import ProgressBar from "./Components/ProgressBar";
const fanImg = require("./Images/89ed3a8a84d78fd19b29e5f0cd6958a2.svg");

type DashboardProps = {
  data: Config;
  dataFetching: boolean;
  handleOnChange: (path: string, value: boolean | number) => void;
};

const Dashboard = ({ data, dataFetching, handleOnChange }: DashboardProps) => {
  const [speed, setSpeed] = useState(0);
  useEffect(() => {
    const calSpeed = 6600 - 60 * data.fan.speed.value;
    setSpeed(data.fan.status.value ? calSpeed : 0);
  }, [data]);

  return (
    <>
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <Row>
          <Col xs={3}>
            <Card className={"h6 bg-light p-2"}>
              <div className="d-flex justify-content-center">
                <Image
                  src={fanImg}
                  className={"col-9"}
                  style={{ animation: `fan-spin infinite ${speed}ms  linear` }}
                />
              </div>
              <Form className="d-flex justify-content-between mt-2">
                <Form.Check.Label>FAN</Form.Check.Label>
                <Form.Check
                  type="switch"
                  checked={data.fan.status.value}
                  onClick={(e) =>
                    handleOnChange(
                      "/dashboard/fan/status",
                      !data.fan.status.value
                    )
                  }
                />
              </Form>
              <div className="d-flex justify-content-between mt-3">
                <div>SPEED</div>
                <input
                  className="mb-2 me-2"
                  type="range"
                  value={Number(data.fan.speed.value)}
                  onChange={(e) =>
                    handleOnChange(
                      "/dashboard/fan/speed",
                      Number(e.target.value)
                    )
                  }
                  min={0}
                  max={100}
                />
              </div>
            </Card>
            <Card className={"h6 mt-3 p-2 pt-3 bg-light"}>
              <Form className="d-flex justify-content-between mb-4">
                <Form.Check.Label>LIGHTS RED</Form.Check.Label>
                <Form.Check
                  type="switch"
                  checked={data.light.red.value}
                  onClick={(e) =>
                    handleOnChange(
                      "/dashboard/light/red",
                      !data.light.red.value
                    )
                  }
                />
              </Form>
              <Form className="d-flex justify-content-between">
                <Form.Check.Label>LIGHTS GREEN</Form.Check.Label>
                <Form.Check
                  type="switch"
                  checked={data.light.green.value}
                  onClick={(e) =>
                    handleOnChange(
                      "/dashboard/light/green",
                      !data.light.green.value
                    )
                  }
                />
              </Form>
            </Card>
          </Col>
          <Col xs={4} className={"d-grid"}>
            <Card className={"bg-light"}>
              <Form className="d-flex justify-content-end me-2 mt-3">
                <Form.Check
                  type="switch"
                  checked={data.light.dimming.value}
                  onClick={(e) =>
                    handleOnChange(
                      "/dashboard/light/dimming",
                      !data.light.dimming.value
                    )
                  }
                />
              </Form>
              <div className="d-flex justify-content-center mb-3">
                <ProgressBar
                  progress={data.light.brightness.value}
                  title={"Brightness"}
                ></ProgressBar>
              </div>
              <div className="d-flex justify-content-center">
                <div>Move the slider to adjust the bulb brightness</div>
              </div>
              <div className="slider mb-3 mt-3">
                <input
                  type="range"
                  value={data.light.brightness.value}
                  onChange={(e) =>
                    handleOnChange(
                      "/dashboard/light/brightness",
                      Number(e.target.value)
                    )
                  }
                  min={0}
                  max={100}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Dashboard;
