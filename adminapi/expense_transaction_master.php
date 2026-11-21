<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchdate1']) && isset($_POST['searchdate2']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	date_default_timezone_set('Asia/Calcutta');
	$da  = date("Y-m-d");
	
	$closing=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$session_dist_ver' AND date<='$da' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$response['cash_in_hand']=$fetch_closing['closing_amt'];
	}
	else
	{
		$response['cash_in_hand']=0;
	}
	
	$total_net_amt=0;
	$res = mysqli_query($con,"select tbl_distributor_expenses_master.*,tbl_expense_head.expense_head_name, tbl_expense_head.expenses_category from tbl_distributor_expenses_master,tbl_expense_head where tbl_distributor_expenses_master.head_id=tbl_expense_head.head_id and tbl_distributor_expenses_master.insert_date>='$cdate1' and tbl_distributor_expenses_master.insert_date<='$cdate2' and tbl_distributor_expenses_master.distributor_id='$session_dist_ver' and tbl_distributor_expenses_master.status='Complete' order by tbl_distributor_expenses_master.expense_master_id DESC");
	$expense_master_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_array($res))
		{
			$flag=0;
			$total_net_amt=$total_net_amt+$fetch_product['final_amount'];
			$expense_master_detail['payment_mode']=$fetch_product['payment_mode'];
			$expense_master_detail['expense_master_id']=$fetch_product['expense_master_id'];
			$expense_master_detail['expense_head_name']=$fetch_product['expense_head_name'];
			$expense_master_detail['expenses_category']=$fetch_product['expenses_category'];
			$expense_master_detail['bill_no']=$fetch_product['bill_no'];
			$expense_master_detail['bill_type']=$fetch_product['bill_type'];
			$expense_master_detail['gstin_no']=$fetch_product['gstin_no'];
			$expense_master_detail['tax_amt']=$fetch_product['tax_amt'];
			$expense_master_detail['taxable_amt']=$fetch_product['taxable_amt'];
			$expense_master_detail['final_amount']=$fetch_product['final_amount'];
			$expense_master_detail['remark']=$fetch_product['remark'];
			$expense_master_detail['insert_date']=$fetch_product['insert_date'];
			if($da!=$fetch_product['insert_date'])
				$flag=1;
			$expense_master_detail['flag']=$flag;
			$response['expense_master_detail'][]=$expense_master_detail;
		}
	}
	else
	{
		$response['expense_master_detail']=$expense_master_detail;
	}
	
	
	$res_head = mysqli_query($con,"select * from tbl_expense_head where distributor_id='$session_dist_ver' and status='Active'");
	$expense_head=array();
	if(mysqli_num_rows($res_head)>0)
	{     
		while($fetch_product=mysqli_fetch_array($res_head))
		{
			$expense_head['head_id']=$fetch_product['head_id'];
			$expense_head['expenses_category']=$fetch_product['expenses_category'];
			$expense_head['expense_head_name']=$fetch_product['expense_head_name'];
			$response['expense_head'][]=$expense_head;
		}
	}
	else
	{
		$response['expense_head']=$expense_head;
	}
	

	$response['total_expense_amt']=$total_net_amt;
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}	
echo json_encode($response);
?>