package dashboard

import (
	"customer-service-system/internal/pkg/httpx"
	"customer-service-system/internal/services"

	"customer-service-system/internal/pkg/httpx/params"
	"customer-service-system/internal/pkg/i18nx"

	"github.com/gin-gonic/gin"
)

func DashboardGetOverview(ctx *gin.Context) {
	rangeValue, _ := params.Get(ctx, "range")
	httpx.WriteJSON(ctx, services.DashboardService.GetOverview(rangeValue, i18nx.Locale(ctx)))
}
