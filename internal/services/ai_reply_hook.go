package services

import "customer-service-system/internal/models"

var TriggerAIReplyAsyncHook func(conversation models.Conversation, message models.Message)
