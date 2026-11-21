<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['txndetail']) && isset($_POST['distributor_id']) && isset($_POST['pmode']) && isset($_POST['tot_amt_val']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d"); 
	$tid1=$_POST['txndetail'];
    $tot_amt_val=$_POST['tot_amt_val'];
	$deposit_bank_id = isset($_POST['bnk_id']) ? $_POST['bnk_id'] : '0';
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
    $pmode=$_POST['pmode'];
	
	$select_product = mysqli_query($con,"select  * from tbl_other_cash_txn_master where transaction_id='$tid1' and status='Complete'");
	if(mysqli_num_rows($select_product)>0)
	{
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$check_amt_val=$fetch_product['txn_amount']-$fetch_product['receive_pay_amount'];
			if($check_amt_val>0)		
			{
				$query1=mysqli_query($con,"INSERT INTO `tbl_other_cash_txn_master_detail`(`transaction_id`,`payment_mode`,`total_amount`,`bank_id`, `receipt_date`,`receipt_time`,`remark`,`status`) VALUES ('$tid1','$pmode','$tot_amt_val','$deposit_bank_id','$da','$scro','$remark','Complete')");
				if($query1)
				{
					$uq=mysqli_query($con,"UPDATE tbl_other_cash_txn_master SET receive_pay_amount=round(receive_pay_amount+'$tot_amt_val',2) where transaction_id ='$tid1'");
					include("cash_bank_effect_class.php");
					if($fetch_product['txn_type']=='To Receive')
					{
						if($deposit_bank_id>0)
						{
							$CashCollection=new Collection();
							$collections=$CashCollection->bankcollection($session_dist_ver,$deposit_bank_id,$tot_amt_val,$da);
						}
						else
						{
							$CashCollection=new Collection();
							$collections=$CashCollection->cashcollection($session_dist_ver,$tot_amt_val,$da);
						}
					}
					else
					{
						if($deposit_bank_id>0)
						{
							$CashCollection=new Collection();
							$collections=$CashCollection->purchasebankcollection($session_dist_ver,$deposit_bank_id,$tot_amt_val,$da);
						}
						else
						{
							$CashCollection=new Collection();
							$collections=$CashCollection->purchasecashcollection($session_dist_ver,$tot_amt_val,$da);
						}
						
					}
					$response['success']='1';
					$response['message']="Receipt successfully Inserted";
				}
			}
		}
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>