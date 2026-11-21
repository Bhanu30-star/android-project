<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['start_date']) && isset($_POST['distributor_id']) && isset($_POST['end_date']))
{
	$cdate1 = $_POST['start_date'];
	$cdate2 = $_POST['end_date'];
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$closing=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$session_dist_ver' AND date<='$cdate11' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$response['cash_in_hand']=$fetch_closing['closing_amt'];
	}
	else
	{
		$response['cash_in_hand']=0;
	}
	
	$res = mysqli_query($con,"select * from tbl_other_cash_txn_master where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status ='Complete' order by insert_date asc");
	$other_txn_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_operator=mysqli_fetch_assoc($res))
		{	
			$other_txn_detail['transaction_id'] = $fetch_operator['transaction_id'];
			$other_txn_detail['retailer_detail'] = $fetch_operator['retailer_detail'];
			$other_txn_detail['insert_date'] = $fetch_operator['insert_date'];
			$other_txn_detail['txn_amount'] = $fetch_operator['txn_amount'];
			$other_txn_detail['txn_type'] = $fetch_operator['txn_type'];
			$other_txn_detail['remark'] = $fetch_operator['remark'];
			$other_txn_detail['receive_pay_amount'] = $fetch_operator['receive_pay_amount'];
			$temp_rid=$fetch_operator['transaction_id'];
			
			$other_txn_detail['txn_in_detail']=array();
			$txn_in_detail=array();
			$res_detail = mysqli_query($con,"select * from tbl_other_cash_txn_master_detail where transaction_id='$temp_rid' and status='Complete'");
			if(mysqli_num_rows($res_detail)>0)
			{     
				while($fetch_product=mysqli_fetch_assoc($res_detail))
				{
					$txn_in_detail['detail_id'] = $fetch_product['detail_id'];
					$txn_in_detail['receipt_date'] = $fetch_product['receipt_date'];
					$txn_in_detail['receipt_time'] = $fetch_product['receipt_time'];
					$txn_in_detail['total_amount'] = $fetch_product['total_amount'];
					$txn_in_detail['payment_mode'] = $fetch_product['payment_mode'];
					$txn_in_detail['bank_id'] = $fetch_product['bank_id'];
					$bank_id=$fetch_product['bank_id'];
					$txn_in_detail['bank_name'] = '';
					if($bank_id>0)
					{
						$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='$bank_id'");
						if(mysqli_num_rows($bank_matser_detail)>0)
						{     
							$fetch_product1=mysqli_fetch_array($bank_matser_detail);
							$txn_in_detail['bank_name'] = $fetch_product1['bank_name'].'-'.$fetch_product1['account_no'];
						} 
					}
					$other_txn_detail['txn_in_detail'][]=$txn_in_detail;
				}
			}
			else
			{
				$other_txn_detail['txn_in_detail']=$txn_in_detail;
			}	
			$response['other_txn_detail'][]=$other_txn_detail;
		}
	}
	else
	{
		$response['other_txn_detail']=$other_txn_detail;
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing!!";
}	
echo json_encode($response);
?>