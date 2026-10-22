from langgraph.graph import StateGraph, END
from app.agents.state import SalesAgentState
from app.agents.nodes.understand import understand_node
from app.agents.nodes.extract import extract_node
from app.agents.nodes.plan import plan_node
from app.agents.nodes.execute import execute_node
from app.agents.nodes.validate import validate_node
from app.agents.nodes.store import store_node
from app.agents.nodes.sync import sync_node


def create_sales_agent_graph():
    """
    Constructs and compiles the 7-node LangGraph StateGraph pipeline.
    """
    workflow = StateGraph(SalesAgentState)

    # 1. Add Nodes
    workflow.add_node("understand", understand_node)
    workflow.add_node("extract", extract_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("execute", execute_node)
    workflow.add_node("validate", validate_node)
    workflow.add_node("store", store_node)
    workflow.add_node("sync", sync_node)

    # 2. Define Execution Edges
    workflow.set_entry_point("understand")
    workflow.add_edge("understand", "extract")
    workflow.add_edge("extract", "plan")
    workflow.add_edge("plan", "execute")
    workflow.add_edge("execute", "validate")
    workflow.add_edge("validate", "store")
    workflow.add_edge("store", "sync")
    workflow.add_edge("sync", END)

    return workflow.compile()


sales_agent_graph = create_sales_agent_graph()
