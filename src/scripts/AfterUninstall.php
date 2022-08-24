<?php

use Espo\Core\Container;

class AfterUninstall
{
    protected Container $container;

    public function run(Container $container, array $params = []): void
    {
        $this->container = $container;
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        try {
            $this->container->get('dataManager')->clearCache();
        } catch (\Exception $e) {
        }
    }
}