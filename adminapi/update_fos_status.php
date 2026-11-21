<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['user_id']))
{
	$get_uid = $_POST['user_id'];
	$ver = $_POST['distributor_id'];
	$execute_flag=0;
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$res = mysqli_query($con,"select status,tb_insertdatetime from tbl_user where distributor_id='$ver' and user_id='$get_uid'");	
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		$status=$fetch_product['status'];
		$insert_datetime=$fetch_product['tb_insertdatetime'];
		$insert_datetime=explode(" ",$insert_datetime);
	}
	if($status=="Deactive")
	{
		$uq1=mysqli_query($con,"UPDATE tbl_user SET status='Active' where user_id='$get_uid'");
		$execute_flag=1;
	}
	else
	{
		$status_flag=0;
		$res_userpro = mysqli_query($con,"select product_id from tbl_product where status='Active' and distributor_id='$ver'");
		while($fetch_userpro=mysqli_fetch_assoc($res_userpro))
		{
			$temp_pro_id=$fetch_userpro['product_id'];
			$res_product = mysqli_query($con,"select quantity from tbl_user_stock where user_id='$get_uid' and product_id='$temp_pro_id' and date<='$da' order by user_product_id DESC limit 1");
			while($fetch_pro_detail=mysqli_fetch_assoc($res_product))
			{
				if($fetch_pro_detail['quantity']>0)
					$status_flag=1;
			}
		}
		$fetch_dsr_last=mysqli_query($con,"SELECT date FROM tbl_dsr where user_id='$get_uid' and dsr_status in ('Pending','Accept') order by date desc limit 1");
		while($fetch_last_dsr=mysqli_fetch_array($fetch_dsr_last))
		{
			$last_dsr_date=$fetch_last_dsr['date'];
		}	
		$last_dsr_date = isset($last_dsr_date) ? $last_dsr_date : $insert_datetime[0];
		$temp_query=mysqli_query($con,"SELECT sum(cash_amount) as cash_amt FROM tbl_party_transaction where transaction_from='$get_uid' and payment_mode!='Credit' and transaction_date>'$last_dsr_date'");
		while($temp_fetch_query=mysqli_fetch_assoc($temp_query))
		{
			$sum_query=round($temp_fetch_query['cash_amt']);
		}													
		$temp_query1=mysqli_query($con,"SELECT sum(tbl_receipt_transaction.cash_amount) as cash_amt1 FROM tbl_receipt_transaction,tbl_party_transaction where tbl_party_transaction.transaction_id=tbl_receipt_transaction.transaction_id and tbl_receipt_transaction.receipt_date>'$last_dsr_date' and tbl_party_transaction.transaction_from='$get_uid'");
		while($temp_fetch_query1=mysqli_fetch_assoc($temp_query1))
		{
			$sum_query1=round($temp_fetch_query1['cash_amt1']);
		}
		$temp_query2=mysqli_query($con,"SELECT sum(tbl_other_receipt_txn.cash_amount) as cash_amt1 FROM tbl_other_receipt_txn where receipt_date>'$last_dsr_date' and user_id='$get_uid'");											
		while($temp_fetch_query2=mysqli_fetch_assoc($temp_query2))
		{
			$sum_query2=round($temp_fetch_query2['cash_amt1']);
		}
		$sum_query=$sum_query+$sum_query1+$sum_query2;
		if($sum_query>0)
			$status_flag=1;
															
		$pending_amount=0;
		$res_userpro = mysqli_query($con,"SELECT sum(tbl_party_transaction.total_amount) as tamt,sum(tbl_party_transaction.cash_amount) as ramt FROM tbl_party_transaction,tbl_user where tbl_party_transaction.transaction_from=tbl_user.user_id  and tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_user.distributor_id='$ver' and tbl_party_transaction.transaction_from='$get_uid'");
		while($fetch_userpro=mysqli_fetch_assoc($res_userpro))
		{
			$pending_amount=$fetch_userpro['tamt']-$fetch_userpro['ramt'];
			if($pending_amount>0)
				$status_flag=1;
		}
		if($status_flag==0)
		{
			$uq1=mysqli_query($con,"UPDATE tbl_user SET status='Deactive' where user_id='$get_uid'");
			$execute_flag=1;
		}
	}
	
	if($execute_flag==1)
	{
		$response['success']='1';
		$response['details']="Update status successfully";
	}
	else
	{
		$response['success']='0';
		$response['details']="FOS can't be deactivated. Please check: 1. If any DSR is not submitted!! 2. If collection is pending against credit sale!! 3. If having stock!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>