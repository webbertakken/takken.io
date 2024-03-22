# Home Assistant

## Introduction

:::info Home Assistant

Home Assistant is an open source home automation system that allows you to use a wide range of
devices and services to automate your home, all from a single interface.

:::

This is where I keep my notes on how to configure Home Assistant.

## Installation type

:::info Installation types

There are 2 ways of installing Home Assistant: **Container** and **Home Assistant OS**.

Container is much more portable as you can run it inside a docker container. However, it requires
you to install any services separately, whereas in Home Assistant OS these can be installed as part
of installing Plugins. Home Assistant OS is usually installed directly on the hardware.

:::

My setup consists of an **Unraid** server that runs the **Container** version alongside various
other services.

## Services

:::info Services

Services are tools that can be installed and deployed separately. I'll commonly refer to
applications that are installed in their own docker images as services, (e.g. InfluxDB, Grafana,
Zigbee2MQTT etc.). Many services have a dedicated web interface, but can also be integrated with
HomeAssistant by using `integrations`.

:::

These are the services I use in my setup.

| Service              | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| HomeAssistant        | Home automation system                                                           |
| HA Cloud (Nabu Casa) | Secure remote access to Home Assistant (needed for Google Assistant, Alexa etc.) |
| InfluxDB             | Time series database                                                             |
| Grafana              | Data visualization                                                               |
| Mosquitto            | MQTT broker                                                                      |
| Zigbee2MQTT          | Zigbee to MQTT bridge                                                            |
| ESPHome              | ESP8266/ESP32 firmware                                                           |

## Integrations

:::info Integrations

I'll refer to functionality that you can install inside the Home Assistant docker container as
integrations. They work as part of the Home Assistant executable and may connect to - and make use
of - services to offer their functionality.

:::

These are the integrations I use in my setup.

| Integration   | Purpose                                   |
| ------------- | ----------------------------------------- |
| Backup        | Backup Home Assistant                     |
| MQTT          | Read/write to Mosquitto                   |
| Tasmota       | Interact with Tasmota devices             |
| HACS          | Home Assistant Community Store            |
| UniFi Network | Monitor network hardware (like PoE ports) |
| UniFi Protect | Access to security (like cameres)         |

## Network

To connect your devices to Home Assistant, you need networking capabilities. I use a combination of
(powered) Ethernet, Wi-Fi and Zigbee. I've thought about leaving zigbee away entirely in favour of
Wi-Fi, but I've learned that connecting too many devices to Wi-Fi can cause issues.

#### Ethernet

- Ubiquiti UniFi
  [UDM-PRO](https://eu.store.ui.com/eu/en/pro/category/all-unifi-gateway-consoles/products/udm-pro)
  (Router)
- Ubiquiti UniFi
  [USW-Pro-24-POE 400W](https://eu.store.ui.com/eu/en/pro/category/all-switching/products/usw-pro-24-poe)
  (Switch)

#### Wi-Fi

- Ubiquiti UniFi [U6 LR](https://eu.store.ui.com/eu/en/pro/category/all-wifi/products/u6-lr) (Access
  Point)

#### Zigbee

Recommended [guide](https://www.zigbee2mqtt.io/guide/adapters/).

- SONOFF Zigbee 3.0 USB Dongle Plus V2 (ZBDongle-E)

:::note Z-Wave

There's also Z-Wave, which is a similar technology to Zigbee, but its downside is that it uses
different frequencies in different countries.

:::

## Devices

These are the devices I've adopted into my home. For some of them I've described the installation
process.

- Ubiquiti UniFi Protect G4-PRO Camera (PoE)
- [Nous A1T 16A Power Monitoring Plug (Wi-Fi)](devices/nous-a1t-16a-power-monitoring-plug)
- [Nous A1Z 16A Power Monitoring Plug (Zigbee)](devices/nous-a1z-16a-power-monitoring-plug)
- [Moes ZB-SD-TD5 GU10 MS LED Spotlight (Zigbee)](devices/moes-zb-td5-gu10-ms-led-spotlight)
- [Moes ZB-TDA9-RCW E27 MS Bulb (Zigbee)](devices/moes-zb-tda9-rcw-e27-ms-bulb)
- [Zemismart ZM25 (Zigbee)](devices/zemismart-zm25-zigbee)
