<?php    
include("../../connect.php");
$response = array();
if(isset($_POST['party']) && isset($_POST['cdate']) && isset($_POST['distributor_id']) && isset($_POST['amount']))
{
	$distributor_id=$_POST['distributor_id'];
	$party_id= $_POST['party'];
	$date=$_POST['cdate'];
	$amount=round($_POST['amount'],2);
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$distributor_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$res_check1st = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id'");
	if(mysqli_num_rows($res_check1st)>0)
	{
		$res_check = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
		if(mysqli_num_rows($res_check)>0)
		{
			$rows_res_check = mysqli_fetch_assoc($res_check);
			$total_closing = $rows_res_check['closing_amount'];
			$diff=round($amount-$total_closing,2);
			$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET closing_amount='$amount' where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			
			$uq_2=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount+'$diff',2),closing_amount= round(closing_amount+'$diff',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
		}
		else
		{
			$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date<'$date' ORDER BY date DESC LIMIT 1");
			if(mysqli_num_rows($res_check_2nd)>0)
			{
				$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
				$total_amount = $rows_res_check['closing_amount'];
				$diff=round($amount-$total_amount,2);
				$uq_1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount,closing_amount, date,time) VALUES ('$distributor_id','$party_id',".$rows_res_check['closing_amount'].",'$amount','$date','$scro')");
				
				$uq_2=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");

			}
			else
			{
				$uq_1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount,closing_amount, date,time) VALUES ('$distributor_id','$party_id','0','$amount','$date','$scro')");
						
				$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
			}
		}
	}
	else
	{
		$uq_1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount,closing_amount, date,time) VALUES ('$distributor_id','$party_id','0','$amount','$date','$scro')");
	}	
	
	$response['success']='1';
	$response['details']="Update Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>