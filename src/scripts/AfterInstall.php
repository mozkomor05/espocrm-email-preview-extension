<?php

use Espo\Core\Container;

class AfterInstall
{
    protected const TAB_LIST_ENTITIES = [];
    protected const DEFAULT_CONFIG = [];

    protected Container $container;

    public function run(Container $container, array $params = []): void
    {
        $this->container = $container;

        if (empty($params['isUpgrade'])) {
            $this->defaultConfig();
            $this->addEntitiesToTabList();
        }

        $this->clearCache();
    }

    protected function defaultConfig(): void
    {
        $config = $this->container->get('config');

        foreach (self::DEFAULT_CONFIG as $key => $value) {
            if (!$config->has($key)) {
                $config->set($key, $value);
            }
        }

        $config->save();
    }

    protected function addEntitiesToTabList(): void
    {
        $config = $this->container->get('config');
        $tabList = $config->get('tabList');

        foreach (self::TAB_LIST_ENTITIES as $entity) {
            if (!in_array($entity, $tabList)) {
                $tabList[] = $entity;
            }
        }

        $config->set('tabList', $tabList);
        $config->save();
    }

    protected function clearCache(): void
    {
        try {
            $this->container->get('dataManager')->clearCache();
        } catch (\Exception $e) {
        }
    }
}