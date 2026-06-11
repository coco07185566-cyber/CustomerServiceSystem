package main

import (
	"log/slog"

	"customer-service-system/internal/bootstrap"
	"customer-service-system/internal/pkg/config"
	"customer-service-system/internal/pkg/logx"
)

func main() {
	cfg, err := config.Load("config/config.yaml")
	if err != nil {
		slog.Error("load config failed", "error", err)
		return
	}
	logx.Init(logx.Config{
		Level:     cfg.Logger.Level,
		Format:    cfg.Logger.Format,
		AddSource: cfg.Logger.AddSource,
	})

	if _, err = bootstrap.InitDB(cfg.DB); err != nil {
		slog.Error("init db failed", "error", err)
		return
	}
	if err = bootstrap.InitMigrations(); err != nil {
		slog.Error("run migrations failed", "error", err)
		return
	}
	slog.Info("migrations completed")
}
