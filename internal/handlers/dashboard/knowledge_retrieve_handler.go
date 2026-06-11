package dashboard

import (
	"customer-service-system/internal/pkg/httpx"
	"context"

	"customer-service-system/internal/ai/rag"
	"customer-service-system/internal/pkg/constants"
	"customer-service-system/internal/pkg/dto/request"
	"customer-service-system/internal/services"

	"customer-service-system/internal/pkg/httpx/params"

	"github.com/gin-gonic/gin"
)

func KnowledgeRetrievePostDebugSearch(ctx *gin.Context) {
	if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionKnowledgeDocumentView); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}

	req := request.KnowledgeSearchRequest{}
	if err := params.ReadJSON(ctx, &req); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}

	resp, err := rag.Answer.DebugSearch(context.Background(), req)
	if err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	httpx.WriteJSON(ctx, resp)
}

func KnowledgeRetrievePostDebugAnswer(ctx *gin.Context) {
	operator, err := services.AuthService.RequirePermission(ctx, constants.PermissionKnowledgeDocumentView)
	if err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}

	req := request.KnowledgeAnswerRequest{}
	if err := params.ReadJSON(ctx, &req); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}

	resp, err := rag.Answer.DebugAnswer(context.Background(), req, operator)
	if err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	httpx.WriteJSON(ctx, resp)
}

func KnowledgeRetrievePostBuild(ctx *gin.Context) {
	req := struct {
		DocumentID int64 `json:"documentId"`
		FAQID      int64 `json:"faqId"`
	}{}
	if err := params.ReadJSON(ctx, &req); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}

	if req.DocumentID > 0 {
		if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionKnowledgeDocumentUpdate); err != nil {
			httpx.WriteJSON(ctx, err)
			return
		}
		if err := rag.Answer.BuildDocumentIndex(context.Background(), req.DocumentID); err != nil {
			httpx.WriteJSON(ctx, err)
			return
		}
		httpx.WriteJSON(ctx, nil)
		return
	}

	if req.FAQID > 0 {
		if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionKnowledgeFAQUpdate); err != nil {
			httpx.WriteJSON(ctx, err)
			return
		}
		if err := rag.Index.IndexFAQByID(context.Background(), req.FAQID); err != nil {
			httpx.WriteJSON(ctx, err)
			return
		}
		httpx.WriteJSON(ctx, nil)
		return
	}

	httpx.WriteJSON(ctx, httpx.JsonErrorMsg(ctx, "error.e0066"))
}
