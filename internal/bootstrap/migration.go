package bootstrap

import (
	"customer-service-system/internal/migration"
	"customer-service-system/internal/models"

	"github.com/mlogclub/simple/sqls"
)

func InitMigrations() error {
	if err := sqls.DB().AutoMigrate(models.Models...); err != nil {
		return err
	}
	return migration.Migrate()
}
