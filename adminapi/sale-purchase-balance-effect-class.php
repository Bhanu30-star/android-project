<?php
ob_start();
class Collectionbalance 
{
	function purchasecollection($distributor_id,$amount,$date,$party_id)
	{
		ob_start();
		include("../../connect.php");
		date_default_timezone_set('Asia/Calcutta');
		$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$distributor_id'");
		if(mysqli_num_rows($disSql)>0)
		{
			$disRow = mysqli_fetch_array($disSql);
			if($disRow['country']=='United Arab Emirates')
				date_default_timezone_set('Asia/Dubai');
		}
		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con,"SELECT * FROM  tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id'");
		if(mysqli_num_rows($res_check1st)>0)
		{
			$res_check = mysqli_query($con,"SELECT * FROM  tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			if(mysqli_num_rows($res_check)>0)
			{
				$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			}
			else
			{
				$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date<'$date' ORDER BY date DESC LIMIT 1");
				if(mysqli_num_rows($res_check_2nd)>0)
				{
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amount']+$amount,2);
					$query1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id',".$rows_res_check['closing_amount'].",'$total_amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");

				}else{
					$query1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id','0','$amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				}
			}
		}else{
			$query1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount,closing_amount, date,time) VALUES ('$distributor_id','$party_id','0','$amount','$date','$scro')");
		}
		return 1;
	}
	function salecollection($distributor_id,$amount,$date,$party_id)
	{
		ob_start();
		include("../../connect.php");
		date_default_timezone_set('Asia/Calcutta');
		$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$distributor_id'");
		if(mysqli_num_rows($disSql)>0)
		{
			$disRow = mysqli_fetch_array($disSql);
			if($disRow['country']=='United Arab Emirates')
				date_default_timezone_set('Asia/Dubai');
		}
		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$distributor_id' and party_id='$party_id'");
		if(mysqli_num_rows($res_check1st)>0)
		{
			$res_check = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			if(mysqli_num_rows($res_check)>0)
			{
				$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			}
			else
			{
				$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date<'$date' ORDER BY date DESC LIMIT 1");
				if(mysqli_num_rows($res_check_2nd)>0)
				{
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amount']+$amount,2);
					$query1 = mysqli_query($con,"INSERT INTO tbl_sale_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id',".$rows_res_check['closing_amount'].",'$total_amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");

				}else{
					$query1 = mysqli_query($con,"INSERT INTO tbl_sale_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id','0','$amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET opening_amount=round(opening_amount+'$amount',2), closing_amount=round(closing_amount+'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				}
			}
		}else{
			$query1 = mysqli_query($con,"INSERT INTO tbl_sale_party_balance(distributor_id,party_id,opening_amount,closing_amount, date,time) VALUES ('$distributor_id','$party_id','0','$amount','$date','$scro')");
		}
		return 1;
	}
	function purchaseminuscollection($distributor_id,$amount,$date,$party_id)
	{
		
		ob_start();
		include("../../connect.php");
		date_default_timezone_set('Asia/Calcutta');
		$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$distributor_id'");
		if(mysqli_num_rows($disSql)>0)
		{
			$disRow = mysqli_fetch_array($disSql);
			if($disRow['country']=='United Arab Emirates')
				date_default_timezone_set('Asia/Dubai');
		}
		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con,"SELECT * FROM  tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id'");
		if(mysqli_num_rows($res_check1st)>0)
		{
			$res_check = mysqli_query($con,"SELECT * FROM  tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			if(mysqli_num_rows($res_check)>0)
			{
				$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount-'$amount',2), closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			}
			else
			{
				$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date<'$date' ORDER BY date DESC LIMIT 1");
				if(mysqli_num_rows($res_check_2nd)>0)
				{
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amount']-$amount,2);
					$query1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id',".$rows_res_check['closing_amount'].",'$total_amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount-'$amount',2), closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");

				}else{
					$query1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id','0','-$amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_purchase_party_balance SET opening_amount=round(opening_amount-'$amount',2), closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				}
			}
		}else{
			$query1 = mysqli_query($con,"INSERT INTO tbl_purchase_party_balance(distributor_id,party_id,opening_amount,closing_amount, date,time) VALUES ('$distributor_id','$party_id','0','-$amount','$date','$scro')");
		}
		return 1;
	}
	function saleminuscollection($distributor_id,$amount,$date,$party_id)
	{
		
		ob_start();
		include("../../connect.php");
		date_default_timezone_set('Asia/Calcutta');
		$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$distributor_id'");
		if(mysqli_num_rows($disSql)>0)
		{
			$disRow = mysqli_fetch_array($disSql);
			if($disRow['country']=='United Arab Emirates')
				date_default_timezone_set('Asia/Dubai');
		}
		$scro = date("h:i:sa");
		$da  = date("Y-m-d");
		$res_check1st = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$distributor_id' and party_id='$party_id'");
		if(mysqli_num_rows($res_check1st)>0)
		{
			$res_check = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			if(mysqli_num_rows($res_check)>0)
			{
				$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET opening_amount=round(opening_amount-'$amount',2), closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date='$date'");
			}
			else
			{
				$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$distributor_id' and party_id='$party_id' and date<'$date' ORDER BY date DESC LIMIT 1");
				if(mysqli_num_rows($res_check_2nd)>0)
				{
					$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
					$total_amount = round($rows_res_check['closing_amount']-$amount,2);
					$query1 = mysqli_query($con,"INSERT INTO tbl_sale_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id',".$rows_res_check['closing_amount'].",'$total_amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET opening_amount=round(opening_amount-'$amount',2), closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");

				}else{
					$query1 = mysqli_query($con,"INSERT INTO tbl_sale_party_balance(distributor_id,party_id,opening_amount, closing_amount,date,time) VALUES ('$distributor_id','$party_id','0','-$amount','$date','$scro')");
					
					$uq_1=mysqli_query($con,"update tbl_sale_party_balance SET opening_amount=round(opening_amount-'$amount',2), closing_amount=round(closing_amount-'$amount',2) where distributor_id='$distributor_id' and party_id='$party_id' and date>'$date'");
				}
			}
		}else{
			$query1 = mysqli_query($con,"INSERT INTO tbl_sale_party_balance(distributor_id,party_id,opening_amount,closing_amount, date, time) VALUES ('$distributor_id','$party_id','0','-$amount','$date','$scro')");
		}
		return 1;
	}
}
?>