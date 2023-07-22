# Home Assistant

:::info

Home Assistant is an open source home automation system that allows you to use a wide range of
devices and services to automate your home, all from a single interface.

:::

This is where I keep my notes on how to configure Home Assistant.

## Installation type

There are 2 ways of installing Home Assistant: `Standalone` and `Home Assistant OS`.

Standalone is much more portable as you can run it inside a docker container. However, it requires
you to install any services separately, whereas in Home Assistant OS these can be installed as part
of installing Plugins. Home Assistant OS is usually installed directly on the hardware.

My setup consists of an `Unraid` server that runs the `Standalone` version alongside various other
services.

## Services

Services are tools that can be installed and deployed separately. I'll commonly refer to
applications that are installed in their own docker images as services, (e.g. InfluxDB, Grafana,
Zigbee2MQTT etc.). Many services have a dedicated web interface, but can also be integrated with
HomeAssistant by using plugins.

## Plugins

I'll refer to functionality that you can install inside the Home Assistant docker container as
plugins. They work as part of the Home Assistant executable and may connect to and make use of
services to offer their functionality.

## Hubs and dongles

Hubs and dongles allow many connections. They are the means to connect your devices to Home
Assistant.

Following are my hubs and dongles.

#### Wi-Fi

- Ubiquiti Unifi 6 LR (Access Point)

#### Zigbee

- SONOFF Zigbee 3.0 USB Dongle Plus V2 (ZBDongle-E)

## Devices

These are the devices I've adopted into my home.

- [Nous A1T 16A Power Monitoring Plug (Wi-Fi)](devices/nous-a1t-16a-power-monitoring-plug)
- [Nous A1Z 16A Power Monitoring Plug (Zigbee)](devices/nous-a1z-16a-power-monitoring-plug)
